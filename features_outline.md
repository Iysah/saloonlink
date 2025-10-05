# Product Requirements Document (PRD)
## TrimsHive Mobile App - Expo Version

### 1. Executive Summary

**Product Name:** TrimsHive  
**Platform:** React (Next JS)  
**Target Audience:** Barbers/Stylists and Customers  
**Primary Goal:** Provide a seamless user experience for salon booking, queue management, and customer engagement

### 2. Product Overview

TrimsHive is a React application that enables barbers and customers to manage salon appointments, walk-in queues, and customer reviews through an intuitive mobile interface. The app leverages the existing Supabase backend and WhatsApp integration for real-time notifications.

### 3. Technical Architecture

#### 3.1 Technology Stack
- **Frontend:** React with Next JS
- **Backend:** Firebase (Database + Auth + Real-time)
- **State Management:** MobX + AsyncStorage
- **Navigation:** Next JS Router (file-based routing)
- **UI Components:** Shadcn UI
- **Notifications:** Firebase Cloud Messaging (FCM) + WhatsApp API (Termii)
- **Maps:** Google Maps
- **Payment Integration:** Paystack for secure payments

#### 3.2 Database Schema (Existing)
```
- profiles (users, roles, phone, profile_picture)
- barber_profiles (salon info, availability, working hours)
- services (barber services, pricing, duration)
- appointments (booking data, status tracking)
- queue (walk-in management, position tracking)
- reviews (ratings, feedback, customer reviews)
- notifications (message history, delivery status)
```

### 4. User Personas

#### 4.1 Customer Persona
- **Name:** Sarah, 28, Office Worker
- **Goals:** Quick booking, real-time updates, quality service
- **Pain Points:** Waiting times, unreliable appointments, poor communication
- **Mobile Usage:** High - uses phone for most daily tasks

#### 4.2 Barber Persona
- **Name:** Mike, 35, Salon Owner
- **Goals:** Manage appointments, reduce no-shows, grow business
- **Pain Points:** Manual booking, customer management, time tracking
- **Mobile Usage:** Medium - prefers mobile for quick tasks

### 5. Core Features

#### 5.1 Authentication & Onboarding
**Priority:** High  
**Description:** Secure user registration and login with role-based access

**Requirements:**
- Email/password authentication via Supabase Auth
- Role selection (Customer/Barber) during registration
- Profile setup with photo upload
- Phone number verification for WhatsApp notifications
- Auto-login with secure token storage

**User Stories:**
- As a customer, I want to create an account quickly so I can start booking appointments
- As a barber, I want to set up my salon profile so customers can find me
- As a user, I want to use biometric login for convenience

#### 5.2 Customer Features

##### 5.2.1 Barber Discovery & Booking
**Priority:** High  
**Description:** Find and book appointments with nearby barbers

**Requirements:**
- Location-based barber search with map integration
- Filter by rating, distance, services, availability
- Sort by highest rated, nearest, or price
- Barber profile viewing (services, prices, reviews, photos)
- Real-time availability checking
- Appointment booking with date/time selection
- Service selection with pricing
- Booking confirmation with WhatsApp notification

**User Stories:**
- As a customer, I want to find nearby barbers with good ratings
- As a customer, I want to see available time slots before booking
- As a customer, I want to receive confirmation of my booking

##### 5.2.2 Walk-in Queue Management
**Priority:** High  
**Description:** Join virtual queues for walk-in services

**Requirements:**
- QR code scanning to join queue
- Real-time queue position updates
- Estimated wait time calculation
- Push/whatsapp notifications for queue updates
- Queue status tracking (waiting, in progress, completed)
- Leave queue functionality

**User Stories:**
- As a customer, I want to scan a QR code to join a queue
- As a customer, I want to know my position and estimated wait time
- As a customer, I want to be notified when it's my turn

##### 5.2.3 Appointment Management
**Priority:** High  
**Description:** View and manage booked appointments

**Requirements:**
- Upcoming appointments list
- Appointment details (date, time, service, barber)
- Status tracking (scheduled, confirmed, in progress, completed)
- Appointment cancellation with notice period
- Appointment rescheduling
- Appointment history
- Push/whatsapp notifications for reminders

**User Stories:**
- As a customer, I want to see all my upcoming appointments
- As a customer, I want to cancel an appointment if needed
- As a customer, I want reminders before my appointment

##### 5.2.4 Reviews & Ratings
**Priority:** Medium  
**Description:** Leave reviews and ratings for completed services

**Requirements:**
- Star rating system (1-5 stars)
- Optional text review
- Review submission for completed appointments
- Review history
- Average rating display for barbers
- Review moderation

**User Stories:**
- As a customer, I want to rate my experience after a service
- As a customer, I want to read reviews before choosing a barber

##### 5.2.5 Notifications
**Priority:** High  
**Description:** Real-time notifications for all activities

**Requirements:**
- Push notifications for appointment updates
- WhatsApp integration for confirmations
- Queue position updates
- Appointment reminders (10 minutes before)
- Customizable notification preferences
- Notification history

**User Stories:**
- As a customer, I want to be notified when my appointment is confirmed
- As a customer, I want reminders before my appointment

#### 5.3 Barber Features

##### 5.3.1 Dashboard & Analytics
**Priority:** High  
**Description:** Comprehensive dashboard for business management

**Requirements:**
- Today's appointments overview
- Queue management
- Revenue tracking
- Customer analytics
- Service performance metrics
- Availability status toggle
- Quick actions (start/complete appointments)

**User Stories:**
- As a barber, I want to see my daily schedule at a glance
- As a barber, I want to track my business performance

##### 5.3.2 Appointment Management
**Priority:** High  
**Description:** Manage customer appointments efficiently

**Requirements:**
- Appointment calendar view
- Appointment details (customer info, service, notes)
- Status updates (start, complete, cancel)
- Customer contact information
- Service history per customer
- Bulk appointment operations

**User Stories:**
- As a barber, I want to easily start and complete appointments
- As a barber, I want to see customer history and preferences

##### 5.3.3 Queue Management
**Priority:** High  
**Description:** Manage walk-in customers efficiently

**Requirements:**
- Real-time queue display
- Add customers to queue
- Update queue positions
- Start/complete queue items
- Estimated wait time calculation
- Queue notifications to customers
- Queue analytics

**User Stories:**
- As a barber, I want to manage my walk-in queue efficiently
- As a barber, I want to notify customers when it's their turn

##### 5.3.4 Service Management
**Priority:** Medium  
**Description:** Manage services, pricing, and availability

**Requirements:**
- Add/edit/delete services
- Set pricing and duration
- Service categories
- Availability settings
- Working hours configuration
- Service performance tracking

**User Stories:**
- As a barber, I want to easily update my services and prices
- As a barber, I want to set my working hours

##### 5.3.5 Reviews & Customer Feedback
**Priority:** Medium  
**Description:** View and respond to customer reviews

**Requirements:**
- Review dashboard with ratings
- Review response functionality
- Review analytics
- Customer feedback trends
- Review moderation tools

**User Stories:**
- As a barber, I want to see my customer reviews and ratings
- As a barber, I want to respond to customer feedback

##### 5.3.6 QR Code Generation
**Priority:** Medium  
**Description:** Generate QR codes for queue management

**Requirements:**
- QR code generation for queue
- QR code sharing options
- QR code customization
- Queue link generation
- Analytics for QR code usage

**User Stories:**
- As a barber, I want to generate QR codes for customers to join my queue
- As a barber, I want to track how many customers use my QR codes

### 6. Technical Requirements

#### 6.1 Performance Requirements
- App launch time: < 3 seconds
- Screen transitions: < 500ms
- Real-time updates: < 2 seconds
- Offline functionality for viewing appointments
- Battery optimization for background sync

#### 6.2 Security Requirements
- Secure authentication with Supabase
- Encrypted data storage
- Secure API communication
- Biometric authentication support
- GDPR compliance for data handling

#### 6.3 Compatibility Requirements
- iOS 13+ and Android 8+
- Support for both phones and tablets
- Responsive design for different screen sizes
- Dark mode support
- Accessibility compliance (WCAG 2.1)

#### 6.4 Offline Requirements
- View existing appointments offline
- Queue up actions when offline
- Sync when connection restored
- Offline error handling
- Data persistence with AsyncStorage

### 7. User Interface Requirements

#### 7.1 Design System
- Consistent color scheme (emerald/rose theme)
- Typography hierarchy
- Icon system (Lucide React)
- Component library
- Loading states and error handling


#### Phase 1: Core Infrastructure (4 weeks)
- Project setup with Next JS
- Authentication system
- Basic navigation structure
- Firebase integration
- Offline data handling

#### Phase 2: Customer Features (6 weeks)
- Barber discovery and search
- Appointment booking system
- Queue management
- Basic notifications
- Profile management

#### Phase 3: Barber Features (6 weeks)
- Dashboard and analytics
- Appointment management
- Queue management
- Service management
- QR code generation

#### Phase 4: Advanced Features (4 weeks)
- Reviews and ratings
- Advanced notifications
- Analytics and reporting
- Performance optimization
- Testing and bug fixes

#### Phase 5: Polish & Launch (2 weeks)
- UI/UX refinements
- Performance optimization
- App store preparation
- Beta testing
- Production deployment

### 10. Success Metrics

#### 10.1 User Engagement
- Daily/Monthly Active Users
- Session duration
- Feature adoption rates
- User retention rates

#### 10.2 Business Metrics
- Number of appointments booked
- Queue usage rates
- Customer satisfaction scores
- Revenue per barber

#### 10.3 Technical Metrics
- App performance (load times, crashes)
- API response times
- Offline usage statistics
- Notification delivery rates

### 11. Risk Assessment

#### 11.1 Technical Risks
- **Real-time sync issues:** Implement robust error handling
- **Offline data conflicts:** Use conflict resolution strategies
- **Performance on older devices:** Optimize for minimum requirements

#### 11.2 Business Risks
- **User adoption:** Focus on core value proposition
- **Competition:** Emphasize unique features (queue management)
- **Regulatory compliance:** Ensure GDPR and local regulations

#### 11.3 Mitigation Strategies
- Comprehensive testing strategy
- Beta testing with real users
- Gradual feature rollout
- Monitoring and analytics

### 12. Future Enhancements

#### 12.1 Phase 2 Features
- Payment integration
- Advanced analytics
- Multi-location support
- Staff management
- Inventory management

#### 12.2 Long-term Vision
- AI-powered scheduling
- Customer loyalty programs
- Integration with POS systems
- White-label solutions
- API for third-party integrations

### 13. Conclusion

The TrimsHive App will provide a comprehensive solution for salon booking and management, leveraging the existing web platform's backend infrastructure while offering a native mobile experience. The focus on real-time updates, offline functionality, and seamless user experience will differentiate it from competitors and drive user adoption.

The phased development approach ensures core functionality is delivered quickly while allowing for iterative improvements based on user feedback and business needs. 