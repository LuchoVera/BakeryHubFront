export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const dateOnlyString = dateString.split("T")[0];
    const parts = dateOnlyString.split("-");

    let date: Date;

    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      date = new Date(Date.UTC(year, month, day));
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return "Fecha Inválida";
    }

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();

    return `${day}-${month}-${year}`;
  } catch (e) {
    return "Fecha Inválida";
  }
};
