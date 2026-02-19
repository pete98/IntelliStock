const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add path mapping support
config.resolver.alias = {
  '@': './src',
};
// Some packages (e.g. @tanstack/react-query@5.90.5) ship broken `exports`
// entries for Metro; disable package exports and use react-native/main fields.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;


