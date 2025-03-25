module.exports = {
  presets: [
    'module:metro-react-native-babel-preset',
    ['@babel/preset-env', {targets: {node: 'current'}}],
  ],
  plugins: [
    ['@babel/plugin-transform-private-methods', {loose: true}],
    ['@babel/plugin-proposal-class-properties', {loose: true}],
  ],
};
