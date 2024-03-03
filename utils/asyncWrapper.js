export default function wrap(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      const { message, code } = error;

      console.error(message, code);
      res.status(code || 500).json({ message });
    }
  };
}
