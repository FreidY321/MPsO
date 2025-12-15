/**
 * Repository index - exports all repository classes
 */

const UserRepository = require('./UserRepository');
const ClassRepository = require('./ClassRepository');
const AuthorRepository = require('./AuthorRepository');
const BookRepository = require('./BookRepository');
const LiteraryClassRepository = require('./LiteraryClassRepository');
const PeriodRepository = require('./PeriodRepository');
const StudentBookRepository = require('./StudentBookRepository');

module.exports = {
  UserRepository,
  ClassRepository,
  AuthorRepository,
  BookRepository,
  LiteraryClassRepository,
  PeriodRepository,
  StudentBookRepository
};
