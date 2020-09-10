import component from "./formGenerator.vue";
import schema from "./utils/schema.js";
import validators from "./utils/validators.js";
import fieldComponents from "./utils/fieldsLoader.js";
import abstractField from "./fields/abstractField.js";
const install = (Vue: any, options: any) => {
  Vue.component("VueFormGenerator", component);
  if (options && options.validators) {
    for (let key in options.validators) {
      if ({}.hasOwnProperty.call(options.validators, key)) {
        validators[key] = options.validators[key];
      }
    }
  }
};

export default {
  component,
  schema,
  validators,
  abstractField,
  fieldComponents,
  install
};
