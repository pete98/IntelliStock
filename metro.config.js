const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add path mapping support
config.resolver.alias = {
  '@': './src',
};

module.exports = config;



