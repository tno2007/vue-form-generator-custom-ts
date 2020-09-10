<!--
<template lang="pug">
//- Working appear/fade animation
div.vue-form-generator(v-if='schema != null')
  fieldset(v-if="schema.fields", :is='tag', class="transition-group-wrapper")
    template(v-for='(field, index) in fields')
      transition(:name="transitionName")
        form-group(v-if='fieldVisible(field)', :vfg="vfg", :field="field", :errors="errors", :model="model", :options="options", @validated="onFieldValidated", @model-updated="onModelUpdated", :key="index")

  template(v-for='group in groups')
    fieldset(:is='tag', :class='getFieldRowClasses(group)')
      legend(v-if='group.legend') {{ group.legend }}
      template(v-for='(field, index) in fields')
        transition(:name="transitionName")
          form-group(v-if='fieldVisible(field)', :vfg="vfg", :field="field", :errors="errors", :model="model", :options="options", @validated="onFieldValidated", @model-updated="onModelUpdated", :key="index")
</template>
-->


<!--
<template lang="pug">
//- unmodified, original
div.vue-form-generator(v-if='schema != null')
  fieldset(v-if="schema.fields", :is='tag')
    template(v-for='field in fields')
      form-group(v-if='fieldVisible(field)', :vfg="vfg", :field="field", :errors="errors", :model="model", :options="options", @validated="onFieldValidated", @model-updated="onModelUpdated")

  template(v-for='group in groups')
    fieldset(:is='tag', :class='getFieldRowClasses(group)')
      legend(v-if='group.legend') {{ group.legend }}
      template(v-for='field in group.fields')
        form-group(v-if='fieldVisible(field)', :vfg="vfg", :field="field", :errors="errors", :model="model", :options="options", @validated="onFieldValidated", @model-updated="onModelUpdated")
</template>
-->

<!-- With transition-group -->
<template lang="pug">
//- transition-group, with 'is' tag
div.vue-form-generator(v-if='schema != null')
  transition-group(v-if="schema.fields", class="transition-group-wrapper", name="vfg-fade", :tag="tag" ref="tg-field")
    template(v-for='(field, index) in fields')
      form-group(v-if='fieldVisible(field)', :vfg="vfg", :field="field", :errors="errors", :model="model", :options="options", @validated="onFieldValidated", @model-updated="onModelUpdated", :key="'single-field' + index")

  template(v-for='(group, index) in groups')
    transition-group(:class='getFieldRowClasses(group)', class="transition-group-wrapper", name="vfg-fade", :tag="tag", ref="tg-group")
      legend(v-if='group.legend && anyGroupFieldsVisible(group)', :key="'group-legend' + index", :class="group.legendClass") {{ group.legend }}
      template(v-for='(field, index) in group.fields')
        form-group(v-if='fieldVisible(field)', :vfg="vfg", :field="field", :errors="errors", :model="model", :options="options", @validated="onFieldValidated", @model-updated="onModelUpdated", :key="'group-field' + index")
</template>


<script lang="ts">
import { getProp, isArray, isFunction, isNil, forEach } from "./utils/common";
import formGroup from "./formGroup.vue";
import formMixin from "./formMixin.js";

export default {
  name: "formGenerator",
  components: { formGroup },
  mixins: [formMixin],
  props: {
    schema: Object,
    model: Object,
    options: {
      type: Object,
      default() {
        return {
          validateAfterLoad: false,
          validateAfterChanged: false,
          fieldIdPrefix: "",
          validateAsync: false,
          validationErrorClass: "error",
          validationSuccessClass: ""
        };
      }
    },

    multiple: {
      type: Boolean,
      default: false
    },

    isNewModel: {
      type: Boolean,
      default: false
    },

    tag: {
      type: String,
      default: "fieldset",
      validator: function(value) {
        return value.length > 0;
      }
    },

    transitionName: {
      type: String,
      default: "fade"
    }
  },

  data() {
    return {
      vfg: this,
      errors: [] // Validation errors
    };
  },

  computed: {
    fields() {
      let res = [];
      if (this.schema && this.schema.fields) {
        this.schema.fields.forEach(field => {
          if (!this.multiple || field.multi === true) res.push(field);
        });
      }

      return res;
    },
    groups() {
      let res = [];
      if (this.schema && this.schema.groups) {
        this.schema.groups.slice(0).forEach(group => {
          res.push(group);
        });
      }

      return res;
    }
  },

  watch: {
    // new model loaded
    model: function(newModel, oldModel) {
      if (oldModel === newModel)
        // model property changed, skip
        return;

      if (newModel != null) {
        this.$nextTick(() => {
          // Model changed!
          if (
            this.options.validateAfterLoad === true &&
            this.isNewModel !== true
          ) {
            this.validate();
          } else {
            this.clearValidationErrors();
          }
        });
      }
    }
  },

  mounted() {
    this.$nextTick(() => {
      if (this.model) {
        // First load, running validation if neccessary
        if (
          this.options.validateAfterLoad === true &&
          this.isNewModel !== true
        ) {
          this.validate();
        } else {
          this.clearValidationErrors();
        }
      }
    });
  },

  methods: {
    // Any group fields visible
    fieldVisible(field) {
      if (isFunction(field.visible))
        return field.visible.call(this, this.model, field, this);

      if (isNil(field.visible)) return true;

      return field.visible;
    },

    // Get visible prop of field
    anyGroupFieldsVisible(group) {
      let visible = false;
      group.fields.forEach(f => {
        if (this.fieldVisible(f)) {
          visible = true;
        }
      });

      return visible;
    },

    // Child field executed validation
    onFieldValidated(res, errors, field) {
      // Remove old errors for this field
      this.errors = this.errors.filter(e => e.field !== field.schema);

      if (!res && errors && errors.length > 0) {
        // Add errors with this field
        errors.forEach(err => {
          this.errors.push({
            field: field.schema,
            error: err
          });
        });
      }

      let isValid = this.errors.length === 0;
      this.$emit("validated", isValid, this.errors, this);
    },

    onModelUpdated(newVal, schema) {
      this.$emit("model-updated", newVal, schema);
    },

    // Validating the model properties
    validate(isAsync = null) {
      if (isAsync === null) {
        isAsync = getProp(this.options, "validateAsync", false);
      }
      this.clearValidationErrors();

      let fields = [];
      let results = [];

      //let parent = this.$children;
      //let parent = this.$refs.tg.$children;

      // groups
      var groups = this.$refs["tg-group"];
      groups.forEach(g => {
        let parent = g.$children;
        parent.forEach(child => {
          if (isFunction(child.validate)) {
            fields.push(child.$refs.child); // keep track of validated children
            results.push(child.validate(true));
          }
        });
      });

      /*
      forEach(parent, child => {
        if (isFunction(child.validate)) {
          fields.push(child.$refs.child); // keep track of validated children
          results.push(child.validate(true));
        }
      });
*/

      let handleErrors = errors => {
        let formErrors = [];
        errors.forEach((err, i) => {
          if (isArray(err) && err.length > 0) {
            err.forEach(error => {
              formErrors.push({
                field: fields[i].schema,
                error: error
              });
            });

            /*forEach(err, error => {
              formErrors.push({
                field: fields[i].schema,
                error: error
              });
            });*/
          }
        });
        this.errors = formErrors;
        let isValid = formErrors.length === 0;
        this.$emit("validated", isValid, formErrors, this);
        return isAsync ? formErrors : isValid;
      };

      if (!isAsync) {
        return handleErrors(results);
      }

      return Promise.all(results).then(handleErrors);
    },

    // Clear validation errors
    clearValidationErrors() {
      this.errors.splice(0);

      //let parent = this.$children;
      let parent = this.$children.$children;

      if (!isArray(parent)) return;
      parent.forEach(child => {
        child.clearValidationErrors();
      });
    }
  }
};
</script>

<style lang="scss">
/*!
 * .\src\common\libs\vue-form-generator-custom\src\formGenerator.vue
 * (c) 2020 Sable International
 */

.vfg-fade-enter,
.vfg-fade-leave-active {
  opacity: 0;
  transform: translateY(-10px);
}

.vfg-fade-leave-active {
  position: absolute;
}

.vue-form-generator {
  * {
    box-sizing: border-box;
  }

  color: #000;

  .transition-group-wrapper {
    display: flex;
    flex-direction: column;
    > * {
      transition: all 0.5s;
      width: 100%;
    }
  }

  .form-control {
    // Default Bootstrap .form-control style
    display: block;
    &:not([class*=" col-"]) {
      width: 100%;
    }
    padding: 6px 12px;
    font-size: 14px;
    line-height: 1.42857143;
    color: #555;
    background-color: #fff;
    background-image: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
    transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
  } // .form-control

  span.help {
    margin-left: 0.3em;
    position: relative;

    .icon {
      display: inline-block;
      width: 16px;
      height: 14px;
      background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAA+UlEQVQ4ja3TS0oDQRAG4C8+lq7ceICICoLGK7iXuNBbeAMJuPVOIm7cqmDiIncIggg+cMZFaqCnZyYKWtB0df31V1VXdfNH6S2wD9CP8xT3KH8T9BiTcE7XBMOfyBcogvCFO9ziLWwFRosyV+QxthNsA9dJkEYlvazsQdi3sBv6Ol6TBLX+HWT3fcQZ3vGM5fBLk+ynAU41m1biCXvhs4OPBDuBpa6GxF0P8YAj3GA1d1qJfdoS4DOIcIm1DK9x8iaWeDF/SP3QU6zRROpjLDFLsFlibx1jJaMkSIGrWKntvItcyTBKzCcybsvc9ZmYz3kz9Ooz/b98A8yvW13B3ch6AAAAAElFTkSuQmCC");
      background-repeat: no-repeat;
      background-position: center center;
    } // .icon

    .helpText {
      background-color: #444;
      bottom: 30px;
      color: #fff;
      display: block;
      left: 0px;
      //margin-bottom: 15px;
      opacity: 0;
      padding: 20px;
      pointer-events: none;
      position: absolute;
      text-align: justify;
      width: 300px;
      //transform: translateY(10%);
      transition: all 0.25s ease-out;
      box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.5);
      border-radius: 6px;

      a {
        font-weight: bold;
        text-decoration: underline;
      } // a
    } // .helpText

    /* This bridges the gap so you can mouse into the tooltip without it disappearing */
    .helpText:before {
      bottom: -20px;
      content: " ";
      display: block;
      height: 20px;
      left: 0;
      position: absolute;
      width: 100%;
    }

    &:hover .helpText {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0px);
    }
  } // span.help

  .field-wrap {
    display: flex;

    .buttons {
      white-space: nowrap;
      margin-left: 4px;
    }

    button,
    input[type="submit"] {
      // Default Bootstrap button style
      display: inline-block;
      padding: 6px 12px;
      margin: 0px;
      font-size: 14px;
      font-weight: normal;
      line-height: 1.42857143;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
      touch-action: manipulation;
      cursor: pointer;
      user-select: none;
      color: #333;
      background-color: #fff;
      border: 1px solid #ccc;
      border-radius: 4px;

      &:not(:last-child) {
        margin-right: 4px;
      }

      &:hover {
        color: #333;
        background-color: #e6e6e6;
        border-color: #adadad;
      }

      &:active {
        color: #333;
        background-color: #d4d4d4;
        border-color: #8c8c8c;
        outline: 0;
        box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    } // button, input[submit]
  } // .field-wrap

  .hint {
    font-style: italic;
    font-size: 0.8em;
  } // .hint
} // fieldset
</style>
