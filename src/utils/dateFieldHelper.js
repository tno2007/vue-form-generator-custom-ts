import { format, parse } from "fecha";

export default {
  formatValueToField(value) {
    if (value != null) {
      let dt = this.schema.format
        ? parse(value, this.schema.format)
        : new Date(value);
      return format(dt, this.getDateFormat());
    }

    return value;
  },

  formatValueToModel(value) {
    if (value != null) {
      let m = parse(value, this.getDateFormat());
      if (this.schema.format) {
        value = format(m, this.schema.format);
      } else {
        value = m.valueOf();
      }
    }

    return value;
  },
};
