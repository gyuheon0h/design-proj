// Custom hook for filter state management
export function useFilters() {
  //   const [filters, setFilters] = useState({
  //     fileType: null,
  //     createdAt: null,
  //     modifiedAt: null,
  //   });
  //   const setFileTypeFilter = (type) =>
  //     setFilters((prev) => ({ ...prev, fileType: type }));
  //   const setCreatedAtFilter = (date) =>
  //     setFilters((prev) => ({ ...prev, createdAt: date }));
  //   const setModifiedAtFilter = (date) =>
  //     setFilters((prev) => ({ ...prev, modifiedAt: date }));
  //   return {
  //     filters,
  //     setFileTypeFilter,
  //     setCreatedAtFilter,
  //     setModifiedAtFilter,
  //   };
}

// Utility for filtering files based on provided filters
// export function filterFiles(files, filters) {
//   return files.filter((file) => {
//     const matchesFileType = filters.fileType
//       ? file.fileType.includes(filters.fileType)
//       : true;
//     const createdAt = new Date(file.createdAt);
//     const modifiedAt = new Date(file.lastModifiedAt);
//     const matchesCreatedAt = filters.createdAt
//       ? createdAt >= new Date(filters.createdAt)
//       : true;
//     const matchesModifiedAt = filters.modifiedAt
//       ? modifiedAt >= new Date(filters.modifiedAt)
//       : true;

//     return matchesFileType && matchesCreatedAt && matchesModifiedAt;
//   });
// }
