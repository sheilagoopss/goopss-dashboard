export function caseInsensitiveSearch(
  str: string | number | boolean | unknown,
  searchString = "",
): boolean {
  let searchValue = "";
  const dataType = typeof str;
  switch (dataType) {
    case "number":
      searchValue = String(str);
      break;
    case "boolean":
      searchValue = String(str);
      break;
    case "string":
      searchValue = (str as string).replace(/,/g, "");
      break;
    default:
      return false;
  }
  return new RegExp(searchString, "i").test(searchValue);
}

export const applyFilterRecursively = (
  tableRow: any,
  values: Record<string, any>,
  columns: {
    title: string;
    dataIndex: string;
    key: string;
    active: boolean;
  }[],
) => {
  const parentMatches = columns
    .filter((c) => c.active)
    .some((v) => {
      return caseInsensitiveSearch(
        tableRow[v.dataIndex as string],
        values.value,
      );
    });

  if (parentMatches) {
    return {
      ...tableRow,
      children: tableRow.children,
    };
  }

  const filteredChildren = tableRow.children
    ?.map((child: any) => applyFilterRecursively(child, values, columns))
    .filter((child: null) => child !== null);

  if (filteredChildren && filteredChildren.length > 0) {
    return {
      ...tableRow,
      children: filteredChildren,
    };
  }

  return null;
};
