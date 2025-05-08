require('dotenv').config();
const axios = require('axios');

// Get environment variables
const studentServiceUrl = process.env.STUDENT_SERVICE_URL;
const driveServiceUrl = process.env.DRIVE_SERVICE_URL;

// Validate environment variables
if (!studentServiceUrl || !driveServiceUrl) {
  console.error('Missing required environment variables:');
  if (!studentServiceUrl) console.error('- STUDENT_SERVICE_URL is not set');
  if (!driveServiceUrl) console.error('- DRIVE_SERVICE_URL is not set');
  process.exit(1);
}

// Configure axios with timeout and retry logic
const axiosInstance = axios.create({
  timeout: 5000, // 5 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Get dashboard overview data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardOverview = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header is required',
        details: 'Please provide a valid bearer token'
      });
    }
    
    console.log('Fetching data from student service:', studentServiceUrl);
    // Fetch data from student service with token
    const studentsResponse = await axiosInstance.get(`${studentServiceUrl}/students`, {
      headers: {
        'Authorization': authHeader
      }
    });
    const students = studentsResponse.data;

    console.log('Fetching data from drive service:', driveServiceUrl);
    // Fetch data from drive service with token
    const drivesResponse = await axiosInstance.get(`${driveServiceUrl}/drives`, {
      headers: {
        'Authorization': authHeader
      }
    });
    const drives = drivesResponse.data.data || []; // Handle the wrapped response format

    // Filter upcoming drives (not expired and future date)
    const upcomingDrives = drives.filter(drive => 
      !drive.isExpired && new Date(drive.date) > new Date()
    );

    // Calculate statistics
    const totalStudents = students.length;
    const vaccinatedStudents = students.filter(student => 
      student.vaccinationRecords && student.vaccinationRecords.length > 0
    ).length;
    const vaccinationPercentage = totalStudents > 0 ? 
      (vaccinatedStudents / totalStudents) * 100 : 0;

    // Prepare response
    const overview = {
      totalStudents,
      vaccinationPercentage: vaccinationPercentage.toFixed(2),
      upcomingDrives: upcomingDrives.length,
      upcomingDrivesList: upcomingDrives.map(drive => ({
        id: drive.id,
        vaccineName: drive.vaccineName,
        date: drive.date,
        grades: drive.grades,
        availableDoses: drive.avilableDoses
      }))
    };

    res.status(200).json(overview);
  } catch (error) {
    console.error('Error fetching dashboard overview:', error + " " + authHeader);
    
    // Handle specific error cases
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'One or more services are currently unavailable'
      });
    }
    
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        error: 'Request timeout',
        details: 'Service request timed out'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch dashboard overview',
      details: error.message + " " + authHeader
    });
  }
};

/**
 * Get additional dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardStats = async (req, res) => {
  try {
    const authHeader = req.headers.authorization; // Get token from request (set by middleware)
    
    console.log('Fetching data from student service:', studentServiceUrl);
    // Fetch data from both services with token
    const [studentsResponse, drivesResponse] = await Promise.all([
      axiosInstance.get(`${studentServiceUrl}/students`, {
        headers: {
          'Authorization': authHeader
        }
      }),
      axiosInstance.get(`${driveServiceUrl}/drives`, {
        headers: {
          'Authorization': authHeader
        }
      })
    ]);

    const students = studentsResponse.data;
    const drives = drivesResponse.data.data || []; // Handle the wrapped response format

    // Calculate additional statistics
    const stats = {
      totalDrives: drives.length,
      completedDrives: drives.filter(drive => drive.isExpired).length,
      activeDrives: drives.filter(drive => !drive.isExpired).length,
      averageStudentsPerDrive: drives.length > 0 ? 
        (students.length / drives.length).toFixed(2) : 0,
      studentParticipationRate: students.length > 0 ? 
        (students.filter(s => s.vaccinationRecords && s.vaccinationRecords.length > 0).length / students.length * 100).toFixed(2) : 0,
      vaccinationByGrade: calculateVaccinationByGrade(students, drives)
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error + " " + authHeader);
    
    // Handle specific error cases
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'One or more services are currently unavailable'
      });
    }
    
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        error: 'Request timeout',
        details: 'Service request timed out'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      details: error.message + " " + authHeader
    });
  }
};

/**
 * Calculate vaccination statistics by grade
 * @param {Array} students - List of students
 * @param {Array} drives - List of drives
 * @returns {Object} Statistics by grade
 */
const calculateVaccinationByGrade = (students, drives) => {
  const gradeStats = {};
  
  students.forEach(student => {
    const grade = student.class;
    if (!gradeStats[grade]) {
      gradeStats[grade] = {
        total: 0,
        vaccinated: 0
      };
    }
    
    gradeStats[grade].total++;
    if (student.vaccinationRecords && student.vaccinationRecords.length > 0) {
      gradeStats[grade].vaccinated++;
    }
  });

  // Calculate percentages
  Object.keys(gradeStats).forEach(grade => {
    const stats = gradeStats[grade];
    stats.percentage = stats.total > 0 ? 
      ((stats.vaccinated / stats.total) * 100).toFixed(2) : 0;
  });

  return gradeStats;
};

module.exports = {
  getDashboardOverview,
  getDashboardStats
}; 