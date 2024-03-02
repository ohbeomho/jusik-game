export default function wrap(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      const { message } = error;

      console.error(message);
      res.render("error", { message });
    }
  };
}
