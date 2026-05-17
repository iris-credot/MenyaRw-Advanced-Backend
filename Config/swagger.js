const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Menya Rwanda API',
      version: '1.0.0',
      description:
        'AI-powered cultural heritage discovery platform for Rwanda. This API powers the Menya Rwanda mobile application — enabling users to discover, navigate to, and learn about Rwanda\'s 530+ cultural and heritage sites through AI storytelling, interactive mapping, and geofencing.',
      contact: {
        name: 'Menya Rwanda Team',
        email: 'support@menyarwanda.rw',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://your-production-url.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token. Get it from POST /auth/login',
        },
      },
      schemas: {
        // ─── USER ──────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            firstName: { type: 'string', example: 'Jean' },
            lastName: { type: 'string', example: 'Uwimana' },
            username: { type: 'string', example: 'jeanuwimana' },
            email: { type: 'string', example: 'jean@example.com' },
            role: { type: 'string', enum: ['user', 'moderator', 'admin'], example: 'user' },
            image: { type: 'string', example: 'https://res.cloudinary.com/...' },
            bio: { type: 'string', example: 'Heritage enthusiast' },
            phoneNumber: { type: 'string', example: '+250788123456' },
            preferredLanguage: { type: 'string', enum: ['en', 'rw', 'fr'], example: 'en' },
            gender: { type: 'string', enum: ['Male', 'Female', 'Other', ''], example: 'Male' },
            verified: { type: 'boolean', example: true },
            mustChangePassword: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── CATEGORY ──────────────────────────────────────────────────────
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            name: {
              type: 'string',
              enum: ['Royal Heritage', 'Genocide Memorial', 'Natural Heritage', 'Colonial-Era Site', 'Living Cultural Site'],
              example: 'Royal Heritage',
            },
            slug: { type: 'string', example: 'royal-heritage' },
            description: { type: 'string', example: 'Sites related to Rwanda\'s royal history' },
            icon: { type: 'string', example: 'crown' },
            color: { type: 'string', example: '#2B6CB0' },
            siteCount: { type: 'integer', example: 12 },
          },
        },

        // ─── MULTILINGUAL ──────────────────────────────────────────────────
        MultilingualField: {
          type: 'object',
          properties: {
            en: { type: 'string', example: 'King\'s Palace Museum' },
            rw: { type: 'string', example: 'Inzu y\'Ubwami' },
            fr: { type: 'string', example: 'Musée du Palais Royal' },
          },
        },

        // ─── SITE ──────────────────────────────────────────────────────────
        Site: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            name: { $ref: '#/components/schemas/MultilingualField' },
            slug: { type: 'string', example: 'kings-palace-museum' },
            category: { $ref: '#/components/schemas/Category' },
            province: {
              type: 'string',
              enum: ['Kigali City', 'Northern', 'Southern', 'Eastern', 'Western'],
              example: 'Southern',
            },
            district: { type: 'string', example: 'Nyanza' },
            historicalPeriod: {
              type: 'string',
              enum: ['Pre-colonial', 'Colonial', 'Post-independence', 'Post-genocide', 'Contemporary', ''],
              example: 'Pre-colonial',
            },
            shortDescription: { $ref: '#/components/schemas/MultilingualField' },
            fullStory: { $ref: '#/components/schemas/MultilingualField' },
            significance: { $ref: '#/components/schemas/MultilingualField' },
            coverImage: { type: 'string', example: 'https://res.cloudinary.com/...' },
            images: { type: 'array', items: { type: 'string' } },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: {
                  type: 'array',
                  items: { type: 'number' },
                  example: [29.7444, -2.3541],
                  description: '[longitude, latitude]',
                },
              },
            },
            address: { type: 'string', example: 'Nyanza District, Southern Province' },
            openingHours: { type: 'string', example: 'Mon-Sun 8AM-5PM' },
            admissionFee: { type: 'string', example: 'RWF 2,000' },
            averageRating: { type: 'number', example: 4.5 },
            totalReviews: { type: 'integer', example: 23 },
            totalVisits: { type: 'integer', example: 156 },
            isPublished: { type: 'boolean', example: true },
            isFeatured: { type: 'boolean', example: false },
            geofence: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean', example: true },
                radius2km: { type: 'number', example: 2000 },
                radius500m: { type: 'number', example: 500 },
                teaser: { $ref: '#/components/schemas/MultilingualField' },
                welcome: { $ref: '#/components/schemas/MultilingualField' },
              },
            },
          },
        },

        // ─── REVIEW ────────────────────────────────────────────────────────
        Review: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            site: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            user: { $ref: '#/components/schemas/User' },
            rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            comment: { type: 'string', example: 'Absolutely breathtaking place!' },
            isVerifiedVisit: { type: 'boolean', example: true },
            visitedOn: { type: 'string', format: 'date', example: '2025-04-15' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── VISIT ─────────────────────────────────────────────────────────
        Visit: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            user: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            site: { $ref: '#/components/schemas/Site' },
            trigger: { type: 'string', enum: ['manual', 'geofence', 'qr'], example: 'geofence' },
            distanceFromSite: { type: 'number', example: 342, description: 'Distance in metres' },
            notes: { type: 'string', example: 'Amazing visit!' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── NOTIFICATION ──────────────────────────────────────────────────
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            user: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            title: { type: 'string', example: 'King\'s Palace Museum is nearby 📍' },
            message: { type: 'string', example: 'You are within 2km of this heritage site.' },
            type: { type: 'string', enum: ['account', 'geofence', 'announcement', 'review', 'system'] },
            site: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            isRead: { type: 'boolean', example: false },
            geofenceZone: { type: 'string', enum: ['2km', '500m'], example: '2km' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── CHAT SESSION ──────────────────────────────────────────────────
        ChatSession: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            user: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            site: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            language: { type: 'string', enum: ['en', 'rw', 'fr'], example: 'en' },
            isActive: { type: 'boolean', example: true },
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['user', 'assistant'] },
                  content: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },

        // ─── ERROR ─────────────────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Resource not found' },
          },
        },

        // ─── SUCCESS ───────────────────────────────────────────────────────
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
          },
        },
      },

      // ─── REUSABLE RESPONSES ─────────────────────────────────────────────
      responses: {
        Unauthorized: {
          description: 'Unauthorized — token missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, message: 'Access denied. Please log in.' },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden — insufficient role permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, message: 'Access denied. This action requires one of: admin.' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, message: 'Resource not found' },
            },
          },
        },
        BadRequest: {
          description: 'Bad request — validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, message: 'Email is required.' },
            },
          },
        },
      },

      // ─── REUSABLE PARAMETERS ────────────────────────────────────────────
      parameters: {
        pageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        limitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 20 },
          description: 'Results per page',
        },
      },
    },

    // ─── TAGS ──────────────────────────────────────────────────────────────
    tags: [
      { name: 'Auth', description: 'Register, login, OTP verification, password reset' },
      { name: 'Users', description: 'User profile management and saved sites' },
      { name: 'Sites', description: 'Heritage site discovery, filtering, and management' },
      { name: 'Categories', description: 'Heritage site category management' },
      { name: 'Reviews', description: 'Site reviews and ratings' },
      { name: 'Visits', description: 'Visit check-ins and history' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Chatbot', description: 'AI heritage storytelling chatbot powered by Claude' },
      { name: 'Geofence', description: 'Location-based proximity detection and notifications' },
      { name: 'Moderators', description: 'Moderator account management (admin only)' },
      { name: 'Activities', description: 'Things visitors can do at a heritage site' },
      { name: 'Exhibits', description: 'Artifacts and exhibits inside a heritage site' },
      { name: 'Timeline', description: 'Historical events timeline for a heritage site' },
      { name: 'Visitor Info', description: 'Practical visitor information — directions, tours, contact, social media' },
      { name: 'Gallery', description: 'Photos and videos for a heritage site' },
    ],

    // ─── PATHS ─────────────────────────────────────────────────────────────
    paths: {

      // ════════════════════════════════════════════════════════════════════
      // AUTH
      // ════════════════════════════════════════════════════════════════════
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          description: 'Creates a new user account and sends a 6-digit OTP to the provided email for verification.',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['firstName', 'email', 'password'],
                  properties: {
                    firstName: { type: 'string', example: 'Jean' },
                    lastName: { type: 'string', example: 'Uwimana' },
                    email: { type: 'string', example: 'jean@example.com' },
                    password: { type: 'string', minLength: 8, example: 'SecurePass123' },
                    gender: { type: 'string', enum: ['Male', 'Female', 'Other'] },
                    phoneNumber: { type: 'string', example: '+250788123456' },
                    preferredLanguage: { type: 'string', enum: ['en', 'rw', 'fr'], default: 'en' },
                    image: { type: 'string', format: 'binary', description: 'Profile photo' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Account created successfully. OTP sent to email.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Account created. OTP sent to your email.' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            400: { $ref: '#/components/responses/BadRequest' },
          },
        },
      },

      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          description: 'Authenticates a user and returns a JWT token. Also sets an httpOnly cookie for web dashboard sessions.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'jean@example.com' },
                    password: { type: 'string', example: 'SecurePass123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      mustChangePassword: { type: 'boolean', example: false },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          firstName: { type: 'string' },
                          lastName: { type: 'string' },
                          email: { type: 'string' },
                          role: { type: 'string' },
                          image: { type: 'string' },
                          preferredLanguage: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout',
          description: 'Clears the JWT cookie. Mobile app clients should discard their token locally.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Logged out successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/auth/verify-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Verify email OTP',
          description: 'Verifies the 6-digit OTP sent to the user\'s email after registration.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['otp'],
                  properties: {
                    otp: { type: 'string', example: '482910' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Account verified',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Account verified.' },
                      token: { type: 'string' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/auth/resend-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Resend OTP',
          description: 'Sends a fresh OTP if the previous one expired.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', example: 'jean@example.com' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'New OTP sent', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
            400: { $ref: '#/components/responses/BadRequest' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Forgot password',
          description: 'Sends a 15-minute password reset link to the user\'s email.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', example: 'jean@example.com' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Reset link sent', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/auth/reset-password/{token}': {
        patch: {
          tags: ['Auth'],
          summary: 'Reset password',
          parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['newPassword', 'confirm'],
                  properties: {
                    newPassword: { type: 'string', minLength: 8, example: 'NewSecurePass123' },
                    confirm: { type: 'string', example: 'NewSecurePass123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Password reset successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user',
          description: 'Returns the currently authenticated user\'s full profile.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Current user',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // USERS
      // ════════════════════════════════════════════════════════════════════
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Get all users (admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'List of all users',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer' },
                      users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      '/users/profile': {
        patch: {
          tags: ['Users'],
          summary: 'Update own profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    username: { type: 'string' },
                    bio: { type: 'string' },
                    phoneNumber: { type: 'string' },
                    gender: { type: 'string', enum: ['Male', 'Female', 'Other'] },
                    preferredLanguage: { type: 'string', enum: ['en', 'rw', 'fr'] },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Profile updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/users/password': {
        patch: {
          tags: ['Users'],
          summary: 'Change password',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string', example: 'OldPass123' },
                    newPassword: { type: 'string', example: 'NewPass456' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Password changed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/users/saved-sites': {
        get: {
          tags: ['Users'],
          summary: 'Get saved heritage sites',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'List of saved sites',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      savedSites: { type: 'array', items: { $ref: '#/components/schemas/Site' } },
                    },
                  },
                },
              },
            },
          },
        },
      },

      '/users/saved-sites/{siteId}': {
        post: {
          tags: ['Users'],
          summary: 'Save or unsave a heritage site',
          description: 'Toggles a site in the user\'s saved list. Call again to unsave.',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'siteId', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Toggled',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      saved: { type: 'boolean', example: true },
                    },
                  },
                },
              },
            },
          },
        },
      },

      '/users/fcm-token': {
        patch: {
          tags: ['Users'],
          summary: 'Register FCM push notification token',
          description: 'Mobile app sends the Firebase Cloud Messaging token for push notifications.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['fcmToken'],
                  properties: {
                    fcmToken: { type: 'string', example: 'fCmToKeN123...' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Token registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          },
        },
      },

      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get user by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'User found', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete user (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'User deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // SITES
      // ════════════════════════════════════════════════════════════════════
      '/sites': {
        get: {
          tags: ['Sites'],
          summary: 'Get all published heritage sites',
          description: 'Returns paginated list of sites with optional filtering.',
          parameters: [
            { in: 'query', name: 'category', schema: { type: 'string' }, description: 'Category ID' },
            { in: 'query', name: 'province', schema: { type: 'string', enum: ['Kigali City', 'Northern', 'Southern', 'Eastern', 'Western'] } },
            { in: 'query', name: 'historicalPeriod', schema: { type: 'string' } },
            { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by name or description' },
            { $ref: '#/components/parameters/pageParam' },
            { $ref: '#/components/parameters/limitParam' },
            { in: 'query', name: 'sort', schema: { type: 'string', default: '-createdAt' } },
          ],
          responses: {
            200: {
              description: 'List of sites',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      total: { type: 'integer', example: 42 },
                      page: { type: 'integer', example: 1 },
                      pages: { type: 'integer', example: 3 },
                      sites: { type: 'array', items: { $ref: '#/components/schemas/Site' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Sites'],
          summary: 'Create a heritage site (admin or moderator)',
          description: 'Creates a new site as a draft. Admin must publish it before it appears publicly.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['name', 'category', 'province', 'longitude', 'latitude'],
                  properties: {
                    name: { type: 'string', description: 'JSON string: {"en":"...","rw":"...","fr":"..."}', example: '{"en":"King\'s Palace Museum","rw":"Inzu y\'Ubwami","fr":"Musée du Palais Royal"}' },
                    category: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
                    province: { type: 'string', enum: ['Kigali City', 'Northern', 'Southern', 'Eastern', 'Western'] },
                    district: { type: 'string' },
                    longitude: { type: 'number', example: 29.7444 },
                    latitude: { type: 'number', example: -2.3541 },
                    shortDescription: { type: 'string', description: 'JSON multilingual string' },
                    fullStory: { type: 'string', description: 'JSON multilingual string' },
                    openingHours: { type: 'string', example: 'Mon-Sun 8AM-5PM' },
                    admissionFee: { type: 'string', example: 'RWF 2,000' },
                    coverImage: { type: 'string', format: 'binary' },
                    images: { type: 'array', items: { type: 'string', format: 'binary' } },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Site created as draft', content: { 'application/json': { schema: { $ref: '#/components/schemas/Site' } } } },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      '/sites/featured': {
        get: {
          tags: ['Sites'],
          summary: 'Get featured heritage sites',
          responses: {
            200: { description: 'Featured sites', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, sites: { type: 'array', items: { $ref: '#/components/schemas/Site' } } } } } } },
          },
        },
      },

      '/sites/nearby': {
        get: {
          tags: ['Sites'],
          summary: 'Get sites near a location',
          description: 'Returns heritage sites sorted by distance from the given coordinates.',
          parameters: [
            { in: 'query', name: 'longitude', required: true, schema: { type: 'number' }, example: 30.0619 },
            { in: 'query', name: 'latitude', required: true, schema: { type: 'number' }, example: -1.9441 },
            { in: 'query', name: 'radius', schema: { type: 'number', default: 5000 }, description: 'Radius in metres' },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: { description: 'Nearby sites', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, sites: { type: 'array', items: { $ref: '#/components/schemas/Site' } } } } } } },
          },
        },
      },

      '/sites/{id}': {
        get: {
          tags: ['Sites'],
          summary: 'Get site by ID or slug',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'MongoDB ObjectId or slug e.g. kings-palace-museum' }],
          responses: {
            200: { description: 'Site details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Site' } } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Sites'],
          summary: 'Update a site (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    shortDescription: { type: 'string' },
                    fullStory: { type: 'string' },
                    openingHours: { type: 'string' },
                    admissionFee: { type: 'string' },
                    coverImage: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Site updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Site' } } } },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Sites'],
          summary: 'Delete a site (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Site deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/sites/{id}/publish': {
        patch: {
          tags: ['Sites'],
          summary: 'Toggle publish status (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Publish status toggled', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, isPublished: { type: 'boolean' } } } } } },
          },
        },
      },

      '/sites/{id}/feature': {
        patch: {
          tags: ['Sites'],
          summary: 'Toggle featured status (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Featured status toggled', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, isFeatured: { type: 'boolean' } } } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // CATEGORIES
      // ════════════════════════════════════════════════════════════════════
      '/categories': {
        get: {
          tags: ['Categories'],
          summary: 'Get all categories',
          description: 'Returns all 5 heritage categories with site count per category.',
          responses: {
            200: { description: 'Categories list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } } } } },
          },
        },
        post: {
          tags: ['Categories'],
          summary: 'Create a category (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', enum: ['Royal Heritage', 'Genocide Memorial', 'Natural Heritage', 'Colonial-Era Site', 'Living Cultural Site'] },
                    description: { type: 'string' },
                    icon: { type: 'string' },
                    color: { type: 'string', example: '#2B6CB0' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Category created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      '/categories/{id}': {
        get: {
          tags: ['Categories'],
          summary: 'Get category by ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Category', content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Categories'],
          summary: 'Update category (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { description: { type: 'string' }, icon: { type: 'string' }, color: { type: 'string' } } } } } },
          responses: { 200: { description: 'Updated' }, 403: { $ref: '#/components/responses/Forbidden' } },
        },
        delete: {
          tags: ['Categories'],
          summary: 'Delete category (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' }, 400: { $ref: '#/components/responses/BadRequest' }, 403: { $ref: '#/components/responses/Forbidden' } },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // REVIEWS
      // ════════════════════════════════════════════════════════════════════
      '/sites/{siteId}/reviews': {
        get: {
          tags: ['Reviews'],
          summary: 'Get all reviews for a site',
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { $ref: '#/components/parameters/pageParam' },
            { $ref: '#/components/parameters/limitParam' },
          ],
          responses: {
            200: { description: 'Reviews list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, total: { type: 'integer' }, reviews: { type: 'array', items: { $ref: '#/components/schemas/Review' } } } } } } },
          },
        },
        post: {
          tags: ['Reviews'],
          summary: 'Submit a review',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'siteId', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['rating'],
                  properties: {
                    rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                    comment: { type: 'string', example: 'Absolutely breathtaking!' },
                    visitedOn: { type: 'string', format: 'date', example: '2025-04-15' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Review submitted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Review' } } } },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/sites/{siteId}/reviews/mine': {
        get: {
          tags: ['Reviews'],
          summary: 'Get my review for a site',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'siteId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'My review or null', content: { 'application/json': { schema: { $ref: '#/components/schemas/Review' } } } },
          },
        },
      },

      '/sites/{siteId}/reviews/{id}': {
        patch: {
          tags: ['Reviews'],
          summary: 'Edit my review',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { rating: { type: 'integer' }, comment: { type: 'string' } } } } } },
          responses: { 200: { description: 'Review updated' }, 403: { $ref: '#/components/responses/Forbidden' } },
        },
        delete: {
          tags: ['Reviews'],
          summary: 'Delete a review (owner or admin/moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Review deleted' }, 403: { $ref: '#/components/responses/Forbidden' } },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // VISITS
      // ════════════════════════════════════════════════════════════════════
      '/visits/my': {
        get: {
          tags: ['Visits'],
          summary: 'Get my visit history',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/pageParam' }, { $ref: '#/components/parameters/limitParam' }],
          responses: {
            200: { description: 'My visits', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, total: { type: 'integer' }, visits: { type: 'array', items: { $ref: '#/components/schemas/Visit' } } } } } } },
          },
        },
      },

      '/visits/sites/{siteId}': {
        post: {
          tags: ['Visits'],
          summary: 'Log a visit / check-in',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'siteId', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    longitude: { type: 'number', example: 29.7444 },
                    latitude: { type: 'number', example: -2.3541 },
                    trigger: { type: 'string', enum: ['manual', 'geofence', 'qr'], default: 'manual' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Visit logged', content: { 'application/json': { schema: { $ref: '#/components/schemas/Visit' } } } },
          },
        },
      },

      '/visits/sites/{siteId}/check': {
        get: {
          tags: ['Visits'],
          summary: 'Check if I have visited a site',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'siteId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Visit status', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, visited: { type: 'boolean', example: true } } } } } },
          },
        },
      },

      '/visits/sites/{siteId}/stats': {
        get: {
          tags: ['Visits'],
          summary: 'Get visit stats for a site (admin or moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'siteId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Visit statistics', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, stats: { type: 'object', properties: { total: { type: 'integer' }, avgDistance: { type: 'number' } } } } } } } },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // NOTIFICATIONS
      // ════════════════════════════════════════════════════════════════════
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Get my notifications',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'unreadOnly', schema: { type: 'boolean' }, description: 'Filter to unread only' },
            { $ref: '#/components/parameters/pageParam' },
            { $ref: '#/components/parameters/limitParam' },
          ],
          responses: {
            200: {
              description: 'Notifications',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      total: { type: 'integer' },
                      unreadCount: { type: 'integer', example: 3 },
                      notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                    },
                  },
                },
              },
            },
          },
        },
      },

      '/notifications/read-all': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark all notifications as read',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'All marked as read', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } } },
        },
      },

      '/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark a notification as read',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Marked as read' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
      },

      '/notifications/{id}': {
        delete: {
          tags: ['Notifications'],
          summary: 'Delete a notification',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // CHATBOT
      // ════════════════════════════════════════════════════════════════════
      '/chatbot/sessions': {
        get: {
          tags: ['Chatbot'],
          summary: 'Get my chat sessions',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'My sessions with last message preview', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, sessions: { type: 'array', items: { $ref: '#/components/schemas/ChatSession' } } } } } } },
          },
        },
      },

      '/chatbot/sessions/current': {
        get: {
          tags: ['Chatbot'],
          summary: 'Get or create a chat session',
          description: 'Returns an existing active session or creates a new one. Optionally scoped to a specific heritage site.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'siteId', schema: { type: 'string' }, description: 'Scope session to a specific site' },
            { in: 'query', name: 'language', schema: { type: 'string', enum: ['en', 'rw', 'fr'] }, description: 'Response language' },
          ],
          responses: {
            200: { description: 'Session', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatSession' } } } },
          },
        },
      },

      '/chatbot/sessions/{sessionId}/message': {
        post: {
          tags: ['Chatbot'],
          summary: 'Send a message and get AI reply',
          description: 'Sends a user message to the AI heritage guide and returns the response. The AI is powered by Anthropic Claude and grounded in the site\'s verified historical content.',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'sessionId', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string', example: 'Tell me about the history of the King\'s Palace Museum' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'AI reply',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      reply: { type: 'string', example: 'The King\'s Palace Museum in Nyanza was the royal residence...' },
                      sessionId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      '/chatbot/sessions/{sessionId}/history': {
        get: {
          tags: ['Chatbot'],
          summary: 'Get session message history',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'sessionId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Message history' } },
        },
      },

      '/chatbot/sessions/{sessionId}/close': {
        patch: {
          tags: ['Chatbot'],
          summary: 'Close a chat session',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'sessionId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Session closed' } },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // GEOFENCE
      // ════════════════════════════════════════════════════════════════════
      '/geofence/ping': {
        post: {
          tags: ['Geofence'],
          summary: 'Send location ping',
          description: 'Mobile app sends GPS coordinates periodically. Server checks if user has entered a 2km or 500m zone around any heritage site and creates notifications if so. Notifications are deduplicated — each zone triggers once per 24 hours.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['longitude', 'latitude'],
                  properties: {
                    longitude: { type: 'number', example: 30.0619 },
                    latitude: { type: 'number', example: -1.9441 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Geofence check result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      triggered: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            site: { type: 'string' },
                            siteName: { type: 'string' },
                            zone: { type: 'string', enum: ['2km', '500m'] },
                            distance: { type: 'number', description: 'Distance in metres' },
                          },
                        },
                      },
                      message: { type: 'string', example: '1 geofence(s) triggered.' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      '/geofence/check': {
        get: {
          tags: ['Geofence'],
          summary: 'Get geofenced sites within radius',
          description: 'Returns all geofence-enabled sites within the given radius. Used by the map screen to draw zone circles.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'longitude', required: true, schema: { type: 'number' } },
            { in: 'query', name: 'latitude', required: true, schema: { type: 'number' } },
            { in: 'query', name: 'radius', schema: { type: 'number', default: 5000 }, description: 'Radius in metres' },
          ],
          responses: {
            200: { description: 'Sites within radius', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, sites: { type: 'array', items: { $ref: '#/components/schemas/Site' } } } } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // MODERATORS
      // ════════════════════════════════════════════════════════════════════
      '/moderators': {
        get: {
          tags: ['Moderators'],
          summary: 'Get all moderators (admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'All moderators with their assigned sites', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, guides: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } } },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['Moderators'],
          summary: 'Create a moderator account (admin)',
          description: 'Admin creates a moderator account, assigns them to a site, and the system emails login credentials with a temporary password.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['firstName', 'email', 'siteId'],
                  properties: {
                    firstName: { type: 'string', example: 'Amina' },
                    lastName: { type: 'string', example: 'Mutesi' },
                    email: { type: 'string', example: 'amina@example.com' },
                    phoneNumber: { type: 'string' },
                    siteId: { type: 'string', description: 'Site to assign the moderator to', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
                    preferredLanguage: { type: 'string', enum: ['en', 'rw', 'fr'] },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Moderator created. Credentials emailed.' },
            400: { $ref: '#/components/responses/BadRequest' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      '/moderators/my-site': {
        get: {
          tags: ['Moderators'],
          summary: 'Get my assigned site (moderator)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Assigned site or null', content: { 'application/json': { schema: { $ref: '#/components/schemas/Site' } } } },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      '/moderators/reassign': {
        patch: {
          tags: ['Moderators'],
          summary: 'Reassign moderator to a different site (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['guideId', 'newSiteId'],
                  properties: {
                    guideId: { type: 'string' },
                    newSiteId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Reassigned successfully' }, 400: { $ref: '#/components/responses/BadRequest' } },
        },
      },

      '/moderators/{id}': {
        get: {
          tags: ['Moderators'],
          summary: 'Get moderator by ID (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Moderator detail with assigned site' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
        delete: {
          tags: ['Moderators'],
          summary: 'Delete moderator account (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Moderator deleted and site unassigned' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
      },

      '/moderators/{id}/unassign': {
        patch: {
          tags: ['Moderators'],
          summary: 'Remove moderator from their site (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Unassigned successfully' } },
        },
      },

      '/moderators/{id}/reset-password': {
        patch: {
          tags: ['Moderators'],
          summary: 'Reset moderator password (admin)',
          description: 'Generates a new temporary password and emails it to the moderator.',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Password reset. New credentials emailed.' } },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // ACTIVITIES
      // ════════════════════════════════════════════════════════════════════
      '/sites/{siteId}/activities': {
        get: {
          tags: ['Activities'],
          summary: 'Get all activities for a site',
          description: 'Public — anyone can view activities for a heritage site.',
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' }, description: 'Site ID' },
          ],
          responses: {
            200: {
              description: 'List of activities',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer', example: 3 },
                      activities: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            site: { type: 'string' },
                            name: { $ref: '#/components/schemas/MultilingualField' },
                            description: { $ref: '#/components/schemas/MultilingualField' },
                            duration: { type: 'string', example: '45 minutes' },
                            included: { type: 'boolean', example: true },
                            image: { type: 'string' },
                            order: { type: 'integer', example: 1 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Activities'],
          summary: 'Add an activity to a site (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', description: 'JSON multilingual: {"en":"...","rw":"...","fr":"..."}', example: '{"en":"Guided Tour","rw":"Inzira y\'ubushishozi","fr":"Visite guidée"}' },
                    description: { type: 'string', description: 'JSON multilingual string' },
                    duration: { type: 'string', example: '45 minutes' },
                    included: { type: 'boolean', example: true, description: 'Included in admission fee' },
                    order: { type: 'integer', example: 1, description: 'Display order' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Activity created' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      '/sites/{siteId}/activities/{activityId}': {
        get: {
          tags: ['Activities'],
          summary: 'Get a single activity',
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'activityId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Activity found' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Activities'],
          summary: 'Update an activity (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'activityId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'JSON multilingual string' },
                    description: { type: 'string', description: 'JSON multilingual string' },
                    duration: { type: 'string' },
                    included: { type: 'boolean' },
                    order: { type: 'integer' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Activity updated' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Activities'],
          summary: 'Delete an activity (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'activityId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Activity deleted' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // EXHIBITS
      // ════════════════════════════════════════════════════════════════════
      '/sites/{siteId}/exhibits': {
        get: {
          tags: ['Exhibits'],
          summary: 'Get all exhibits for a site',
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'List of exhibits',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer' },
                      exhibits: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            name: { $ref: '#/components/schemas/MultilingualField' },
                            description: { $ref: '#/components/schemas/MultilingualField' },
                            image: { type: 'string' },
                            yearCreated: { type: 'integer', example: 1850 },
                            origin: { $ref: '#/components/schemas/MultilingualField' },
                            material: { $ref: '#/components/schemas/MultilingualField' },
                            location: { $ref: '#/components/schemas/MultilingualField' },
                            order: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Exhibits'],
          summary: 'Add an exhibit to a site (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', description: 'JSON multilingual string', example: '{"en":"Royal Throne","rw":"Intebe y\'Umwami","fr":"Trône Royal"}' },
                    description: { type: 'string', description: 'JSON multilingual string' },
                    yearCreated: { type: 'integer', example: 1850 },
                    origin: { type: 'string', description: 'JSON multilingual string' },
                    material: { type: 'string', description: 'JSON multilingual string' },
                    location: { type: 'string', description: 'Where inside the site it is displayed — JSON multilingual string' },
                    order: { type: 'integer' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Exhibit created' },
            400: { $ref: '#/components/responses/BadRequest' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      '/sites/{siteId}/exhibits/{exhibitId}': {
        get: {
          tags: ['Exhibits'],
          summary: 'Get a single exhibit',
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'exhibitId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Exhibit found' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Exhibits'],
          summary: 'Update an exhibit (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'exhibitId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'JSON multilingual string' },
                    description: { type: 'string', description: 'JSON multilingual string' },
                    yearCreated: { type: 'integer' },
                    origin: { type: 'string', description: 'JSON multilingual string' },
                    material: { type: 'string', description: 'JSON multilingual string' },
                    location: { type: 'string', description: 'JSON multilingual string' },
                    order: { type: 'integer' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Exhibit updated' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Exhibits'],
          summary: 'Delete an exhibit (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'exhibitId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Exhibit deleted' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // TIMELINE
      // ════════════════════════════════════════════════════════════════════
      '/sites/{siteId}/timeline': {
        get: {
          tags: ['Timeline'],
          summary: 'Get full timeline for a site',
          description: 'Returns all historical events sorted chronologically by year.',
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Timeline events',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer' },
                      events: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            year: { type: 'integer', example: 1932 },
                            month: { type: 'integer', example: 4, nullable: true },
                            title: { $ref: '#/components/schemas/MultilingualField' },
                            description: { $ref: '#/components/schemas/MultilingualField' },
                            image: { type: 'string' },
                            isKeyEvent: { type: 'boolean', example: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Timeline'],
          summary: 'Add a timeline event (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['year', 'title'],
                  properties: {
                    year: { type: 'integer', example: 1932 },
                    month: { type: 'integer', example: 4, description: 'Optional month (1-12)' },
                    title: { type: 'string', description: 'JSON multilingual string', example: '{"en":"Palace constructed","rw":"Inzu yubatswe","fr":"Palais construit"}' },
                    description: { type: 'string', description: 'JSON multilingual string' },
                    isKeyEvent: { type: 'boolean', example: true, description: 'Highlight as a major milestone' },
                    image: { type: 'string', format: 'binary', description: 'Optional photo for this event' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Timeline event added' },
            400: { $ref: '#/components/responses/BadRequest' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      '/sites/{siteId}/timeline/{eventId}': {
        get: {
          tags: ['Timeline'],
          summary: 'Get a single timeline event',
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'eventId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Event found' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Timeline'],
          summary: 'Update a timeline event (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'eventId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    year: { type: 'integer' },
                    month: { type: 'integer' },
                    title: { type: 'string', description: 'JSON multilingual string' },
                    description: { type: 'string', description: 'JSON multilingual string' },
                    isKeyEvent: { type: 'boolean' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Event updated' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Timeline'],
          summary: 'Delete a timeline event (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'eventId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Event deleted' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // VISITOR INFO
      // ════════════════════════════════════════════════════════════════════
      '/sites/{siteId}/visitor-info': {
        get: {
          tags: ['Visitor Info'],
          summary: 'Get visitor info for a site',
          description: 'Public — returns practical visitor information including directions, parking, guided tours, contact details, and social media.',
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Visitor info or null if not yet added',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      visitorInfo: {
                        type: 'object',
                        nullable: true,
                        properties: {
                          gettingThere: { $ref: '#/components/schemas/MultilingualField' },
                          parking: { type: 'boolean' },
                          wheelchairAccessible: { type: 'boolean' },
                          bestTimeToVisit: { $ref: '#/components/schemas/MultilingualField' },
                          averageVisitDuration: { type: 'string', example: '2-3 hours' },
                          guidedTours: { type: 'boolean' },
                          guidedTourSchedule: { type: 'string', example: 'Daily at 9AM, 11AM, 2PM' },
                          guidedTourFee: { type: 'string' },
                          availableLanguages: { type: 'array', items: { type: 'string' }, example: ['en', 'rw', 'fr'] },
                          nearbyAccommodation: { $ref: '#/components/schemas/MultilingualField' },
                          dresscode: { $ref: '#/components/schemas/MultilingualField' },
                          photographyAllowed: { type: 'boolean' },
                          tips: { $ref: '#/components/schemas/MultilingualField' },
                          phone: { type: 'string' },
                          email: { type: 'string' },
                          officialWebsite: { type: 'string' },
                          socialMedia: {
                            type: 'object',
                            properties: {
                              facebook: { type: 'string' },
                              instagram: { type: 'string' },
                              twitter: { type: 'string' },
                              youtube: { type: 'string' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        put: {
          tags: ['Visitor Info'],
          summary: 'Create or update visitor info (admin or assigned moderator)',
          description: 'Uses upsert — creates if it does not exist, updates if it does. Send only the fields you want to update.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    gettingThere: { type: 'object', description: 'Multilingual: {en, rw, fr}', example: { en: 'Take bus 16 from Kigali to Nyanza', rw: '', fr: '' } },
                    parking: { type: 'boolean', example: true },
                    parkingDetails: { type: 'object', description: 'Multilingual: {en, rw, fr}' },
                    wheelchairAccessible: { type: 'boolean', example: false },
                    accessibility: { type: 'object', description: 'Multilingual: {en, rw, fr}' },
                    bestTimeToVisit: { type: 'object', example: { en: 'Early morning, dry season (June-September)', rw: '', fr: '' } },
                    averageVisitDuration: { type: 'string', example: '2-3 hours' },
                    guidedTours: { type: 'boolean', example: true },
                    guidedTourSchedule: { type: 'string', example: 'Daily at 9AM, 11AM, 2PM' },
                    guidedTourFee: { type: 'string', example: 'RWF 1,000' },
                    availableLanguages: { type: 'array', items: { type: 'string', enum: ['en', 'rw', 'fr'] }, example: ['en', 'rw'] },
                    nearbyAccommodation: { type: 'object', description: 'Multilingual: {en, rw, fr}' },
                    nearbyRestaurants: { type: 'object', description: 'Multilingual: {en, rw, fr}' },
                    nearbyAttractions: { type: 'object', description: 'Multilingual: {en, rw, fr}' },
                    dresscode: { type: 'object', example: { en: 'Modest dress required', rw: '', fr: '' } },
                    photographyAllowed: { type: 'boolean', example: true },
                    photographyRules: { type: 'object', description: 'Multilingual: {en, rw, fr}' },
                    tips: { type: 'object', example: { en: 'Arrive early to avoid crowds', rw: '', fr: '' } },
                    phone: { type: 'string', example: '+250788123456' },
                    email: { type: 'string', example: 'info@kingspalace.rw' },
                    officialWebsite: { type: 'string', example: 'https://kingspalace.rw' },
                    socialMedia: {
                      type: 'object',
                      properties: {
                        facebook: { type: 'string' },
                        instagram: { type: 'string' },
                        twitter: { type: 'string' },
                        youtube: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Visitor info saved' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
        delete: {
          tags: ['Visitor Info'],
          summary: 'Delete visitor info (admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Visitor info deleted' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // GALLERY
      // ════════════════════════════════════════════════════════════════════
      '/sites/{siteId}/gallery': {
        get: {
          tags: ['Gallery'],
          summary: 'Get gallery for a site',
          description: 'Returns all photos and videos. Filter by type using query param.',
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'query', name: 'type', schema: { type: 'string', enum: ['photo', 'video'] }, description: 'Filter by media type' },
          ],
          responses: {
            200: {
              description: 'Gallery items',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer' },
                      gallery: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            type: { type: 'string', enum: ['photo', 'video'] },
                            title: { $ref: '#/components/schemas/MultilingualField' },
                            caption: { $ref: '#/components/schemas/MultilingualField' },
                            url: { type: 'string', example: 'https://res.cloudinary.com/...' },
                            thumbnailUrl: { type: 'string' },
                            order: { type: 'integer' },
                            isCover: { type: 'boolean' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Gallery'],
          summary: 'Add a photo or video to gallery (admin or assigned moderator)',
          description: 'For photos — upload an image file. For videos — provide a YouTube embed URL in the videoUrl field.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['type'],
                  properties: {
                    type: { type: 'string', enum: ['photo', 'video'], example: 'photo' },
                    title: { type: 'string', description: 'JSON multilingual string' },
                    caption: { type: 'string', description: 'JSON multilingual string' },
                    image: { type: 'string', format: 'binary', description: 'Required for type=photo' },
                    videoUrl: { type: 'string', example: 'https://www.youtube.com/embed/xxxxx', description: 'Required for type=video' },
                    thumbnailUrl: { type: 'string', description: 'Optional thumbnail for videos' },
                    order: { type: 'integer', example: 1 },
                    isCover: { type: 'boolean', example: false, description: 'Set as the main cover image for the site' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Gallery item added' },
            400: { $ref: '#/components/responses/BadRequest' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
        delete: {
          tags: ['Gallery'],
          summary: 'Clear entire gallery for a site (admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Gallery cleared' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      '/sites/{siteId}/gallery/{itemId}': {
        get: {
          tags: ['Gallery'],
          summary: 'Get a single gallery item',
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'itemId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Gallery item found' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Gallery'],
          summary: 'Update a gallery item (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'itemId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'JSON multilingual string' },
                    caption: { type: 'string', description: 'JSON multilingual string' },
                    order: { type: 'integer' },
                    isCover: { type: 'boolean' },
                    image: { type: 'string', format: 'binary', description: 'Replace existing photo' },
                    videoUrl: { type: 'string', description: 'Replace existing video URL' },
                    thumbnailUrl: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Gallery item updated' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Gallery'],
          summary: 'Delete a gallery item (admin or assigned moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'siteId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'itemId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Gallery item deleted' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════
      // HEALTH
      // ════════════════════════════════════════════════════════════════════
      '/health': {
        get: {
          tags: ['Auth'],
          summary: 'Health check',
          description: 'Check if the API is running.',
          responses: {
            200: {
              description: 'API is running',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'OK' },
                      message: { type: 'string', example: 'Menya Rwanda API is running' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // we define everything inline above
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;