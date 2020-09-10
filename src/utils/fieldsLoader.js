let fieldComponents = {};

function requireAll(r) {
  const dirContent = r.keys().map(r);
  const obj = {};

  dirContent.map((value) => {
    let name = value.substring(
      value.indexOf("img/") + 4,
      value.indexOf(".", 3)
    );
    obj[name] = value;
  });

  return obj;
}

let coreFields = require("../fields/core/*.vue");

Object.keys(coreFields).forEach((key) => {
  let compName = key.replace(/^\.\//, "").replace(/\.vue/, "");
  fieldComponents[compName] = coreFields[key].default;
});

if (process.env.FULL_BUNDLE) {
  let optionalFields = require("../fields/optional/*.vue");

  Object.keys(optionalFields).forEach((key) => {
    let compName = key.replace(/^\.\//, "").replace(/\.vue/, "");
    fieldComponents[compName] = optionalFields[key].default;
  });
}

export default fieldComponents;
