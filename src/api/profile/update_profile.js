"use strict"

const middlewareFactory = require('../../lib/middleware_factory');
const { authenticateRequestMiddleware, alertCrashedEvent } = require('../../lib/util');

const validateRequest = () => (req, res, next) => {

  const requiredProps = [
    'fullname',
    'email',
    'phone',
    'display_name',
    'gender',
    'additional_email',
    'additional_phone',
    'address'
  ];
  const hasRequiredProp = requiredProps.some(prop => req.body[prop] !== undefined);

  if (hasRequiredProp && req.query.a) {
    next();
  } else {
    res.status(400).send();
  }
}

const validateAppThenStoreToLocals = middlewareFactory.create(
  'validateAppThenStoreToLocals',
  'byRequestQuery',
  'update_profile.js'
);

const updateProfile = (helpers) => async (req, res, next) => {
  try {
    await helpers.Database.Account.Profile.update(res.locals.uid, req.body);
    next();
  } catch (err) {
    res.status(403).send();
    helpers.alert && alertCrashedEvent(helpers.alert, 'update_profile.js', 'updateProfile', err);
  }
}

const final = () => (req, res) => res.status(200).send();

module.exports = [
  validateRequest,
  validateAppThenStoreToLocals,
  authenticateRequestMiddleware,
  updateProfile,
  final
];