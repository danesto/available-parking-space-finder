const getLotClassNameByCount = (count: string) => {
  const spacesCount = count && parseInt(count);

  if (spacesCount && spacesCount >= 10) {
    return spacesCount <= 20 ? "almost-full" : "more-than-20";
  } else if (spacesCount && spacesCount > 0) {
    return "between-10-and-1";
  }

  return "full-or-less-than-10";
};

export { getLotClassNameByCount };
