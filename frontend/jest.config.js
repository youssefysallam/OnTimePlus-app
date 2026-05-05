module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo|expo-.*|@expo(nent)?/.*|@expo/.*|expo-modules-core|@react-navigation/.*|react-native-reanimated|@gorhom)/)',
  ],
};
