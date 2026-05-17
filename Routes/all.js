const express = require('express');
const Router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./user');
const siteRoutes = require('./site');       // reviews are nested inside site as /:siteId/reviews
const categoryRoutes = require('./category');
const visitRoutes = require('./visit');
const notificationRoutes = require('./notification');
const chatbotRoutes = require('./chatbot');
const geofenceRoutes = require('./geofence');
const moderatorRoutes = require('./guide');

Router.use('/auth', authRoutes);
Router.use('/users', userRoutes);
Router.use('/sites', siteRoutes);          // handles /sites and /sites/:siteId/reviews
Router.use('/categories', categoryRoutes);
Router.use('/visits', visitRoutes);
Router.use('/notifications', notificationRoutes);
Router.use('/chatbot', chatbotRoutes);
Router.use('/geofence', geofenceRoutes);
Router.use('/moderators', moderatorRoutes);

Router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = Router;