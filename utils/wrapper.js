export default function asyncWrapper(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      res.sendStatus(500);
      console.error(error.message);
    }
  }
}
