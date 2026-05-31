const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.resolver.assetExts = [...resolver.assetExts, 'tflite', 'bin'];

module.exports = config;
