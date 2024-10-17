export function filterUndefined(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const filteredObj: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "object" && !Array.isArray(value)) {
        const nestedObj = filterUndefined(value as Record<string, unknown>);
        if (Object.keys(nestedObj).length > 0) {
          filteredObj[key] = nestedObj;
        }
      } else if (Array.isArray(value)) {
        const filteredArray = value
          .map((item) =>
            typeof item === "object" && item !== null
              ? filterUndefined(item as Record<string, unknown>)
              : item,
          )
          .filter((item) => item !== undefined && item !== null && item !== "");
        if (filteredArray.length > 0) {
          filteredObj[key] = filteredArray;
        }
      } else {
        filteredObj[key] = value;
      }
    }
  });

  return filteredObj;
}
