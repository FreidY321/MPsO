const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Povinná Četba API',
      version: '1.0.0',
      description: 'API pro správu povinné četby - systém pro evidenci a validaci seznamů četby žáků',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token získaný z /api/auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Error message'
                },
                statusCode: {
                  type: 'integer',
                  example: 400
                },
                validationErrors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string'
                      },
                      message: {
                        type: 'string'
                      },
                      value: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            role: {
              type: 'string',
              enum: ['student', 'teacher', 'admin'],
              example: 'student'
            },
            degree: {
              type: 'string',
              nullable: true,
              example: 'Mgr.'
            },
            name: {
              type: 'string',
              example: 'Jan'
            },
            seccond_name: {
              type: 'string',
              nullable: true,
              example: null
            },
            surname: {
              type: 'string',
              example: 'Novák'
            },
            second_surname: {
              type: 'string',
              nullable: true,
              example: null
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'jan.novak@example.com'
            },
            class_id: {
              type: 'integer',
              nullable: true,
              example: 1
            },
            google_id: {
              type: 'string',
              nullable: true,
              example: null
            }
          }
        },
        Class: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: '4.A'
            },
            year_ended: {
              type: 'integer',
              example: 2024
            },
            deadline: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2024-05-31T23:59:59Z'
            },
            cj_teacher: {
              type: 'integer',
              nullable: true,
              example: 2
            }
          }
        },
        Author: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'Karel'
            },
            second_name: {
              type: 'string',
              nullable: true,
              example: null
            },
            surname: {
              type: 'string',
              example: 'Čapek'
            },
            second_surname: {
              type: 'string',
              nullable: true,
              example: null
            }
          }
        },
        LiteraryClass: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'Česká literatura'
            },
            min_request: {
              type: 'integer',
              example: 5
            },
            max_request: {
              type: 'integer',
              example: 10
            }
          }
        },
        Period: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: '19. století'
            },
            min_request: {
              type: 'integer',
              example: 3
            },
            max_request: {
              type: 'integer',
              example: 8
            }
          }
        },
        Book: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'R.U.R.'
            },
            url_book: {
              type: 'string',
              example: 'https://example.com/book/rur'
            },
            author_id: {
              type: 'integer',
              example: 1
            },
            translator_name: {
              type: 'string',
              example: ''
            },
            period: {
              type: 'integer',
              example: 3
            },
            literary_class: {
              type: 'integer',
              example: 1
            },
            author_name: {
              type: 'string',
              example: 'Karel Čapek'
            },
            period_name: {
              type: 'string',
              example: '20. století'
            },
            literary_class_name: {
              type: 'string',
              example: 'Česká literatura'
            }
          }
        },
        ReadingListStatus: {
          type: 'object',
          properties: {
            studentId: {
              type: 'integer',
              example: 1
            },
            totalBooks: {
              type: 'integer',
              example: 15
            },
            literaryClassProgress: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer'
                  },
                  name: {
                    type: 'string'
                  },
                  currentCount: {
                    type: 'integer'
                  },
                  minRequired: {
                    type: 'integer'
                  },
                  maxAllowed: {
                    type: 'integer'
                  },
                  isSatisfied: {
                    type: 'boolean'
                  },
                  isOverLimit: {
                    type: 'boolean'
                  }
                }
              }
            },
            periodProgress: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer'
                  },
                  name: {
                    type: 'string'
                  },
                  currentCount: {
                    type: 'integer'
                  },
                  minRequired: {
                    type: 'integer'
                  },
                  maxAllowed: {
                    type: 'integer'
                  },
                  isSatisfied: {
                    type: 'boolean'
                  },
                  isOverLimit: {
                    type: 'boolean'
                  }
                }
              }
            },
            authorCounts: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  fullName: {
                    type: 'string'
                  },
                  count: {
                    type: 'integer'
                  },
                  canAddMore: {
                    type: 'boolean'
                  }
                }
              }
            },
            isComplete: {
              type: 'boolean',
              example: true
            },
            violations: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Chybí nebo je neplatný autentizační token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  message: 'Invalid or expired token',
                  statusCode: 401
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Nedostatečná oprávnění',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  message: 'Insufficient permissions',
                  statusCode: 403
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Zdroj nebyl nalezen',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  message: 'Resource not found',
                  statusCode: 404
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Chyba validace vstupních dat',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  message: 'Validation failed',
                  statusCode: 400,
                  validationErrors: [
                    {
                      field: 'email',
                      message: 'Valid email is required',
                      value: 'invalid-email'
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Autentizace a správa session'
      },
      {
        name: 'Users',
        description: 'Správa uživatelů (žáci, učitelé, admini)'
      },
      {
        name: 'Classes',
        description: 'Správa tříd'
      },
      {
        name: 'Authors',
        description: 'Správa autorů knih'
      },
      {
        name: 'Literary Classes',
        description: 'Správa literárních druhů'
      },
      {
        name: 'Periods',
        description: 'Správa literárních období'
      },
      {
        name: 'Books',
        description: 'Správa knih povinné četby'
      },
      {
        name: 'Reading Lists',
        description: 'Správa seznamů četby žáků'
      }
    ]
  },
  apis: ['./routes/*.js', './swagger-docs.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
