# DashBoard_Scalable_Service

Dashboard service provides overview statistics and analytics for the School Vaccination Portal.

## Features
- Vaccination statistics overview
- Student participation metrics
- Upcoming and completed drive analytics
- Grade-wise vaccination tracking

## Endpoints
- `GET /dashboard/overview` - Get high-level vaccination statistics
  - Total students
  - Vaccination percentage
  - Upcoming drives count and details
  
- `GET /dashboard/stats` - Get detailed analytics
  - Total/completed/active drives
  - Average students per drive
  - Student participation rate
  - Grade-wise vaccination data

## Authentication
- JWT token-based authentication required
- Pass token in Authorization header

## Setup Instructions

npm install
npm start 

Port:4003

##Note: 

it required Student , Auth ,Vacination scalable services for the application to run which runs on different ports if deployed in docker and can be setup the url by changing in the env if deployed in different servers


For API documentation (SWAGGER api) - http://localhost:4003/api-docs
