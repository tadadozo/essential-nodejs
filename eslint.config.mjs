import globals from "globals";
import pluginJs from "@eslint/js";
import jsdoc from 'eslint-plugin-jsdoc';


export default [
  {
    files: ['**/*.js'],
    plugins:{
      jsdoc
    },
    languageOptions: { 
      sourceType: "module",
      globals: {
        ...globals.node
      }
     },
    rules: {
      'jsdoc/require-description': 'warn'
    }
  }
];