function toISODate(date = new Date()) {
  const value = date instanceof Date ? date : new Date(`${date}T00:00:00`);
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function todayISO() {
  return toISODate(new Date());
}

function addMonths(dateInput, months = 1) {
  const value = new Date(`${dateInput}T00:00:00`);
  const originalDay = value.getDate();
  value.setMonth(value.getMonth() + Number(months));

  if (value.getDate() < originalDay) {
    value.setDate(0);
  }

  return toISODate(value);
}

function statusFromEndDate(endDate) {
  return endDate >= todayISO() ? "activo" : "vencido";
}

function toDateTime(value) {
  if (!value) return new Date();
  if (String(value).length === 10) return `${value} 12:00:00`;
  return String(value).replace("T", " ");
}

module.exports = {
  addMonths,
  statusFromEndDate,
  todayISO,
  toDateTime,
  toISODate
};
