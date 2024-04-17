export default function wrap(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      const { message } = error;

      if (error instanceof Error) {
        console.error(message, error.stack);
        res.status(500).json({ message });
      } else {
        const { code } = error;

        console.error(message, code);
        res.status(code || 500).json({ message });
      }
    }
  };
}
