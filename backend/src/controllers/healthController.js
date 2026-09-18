function createHealthController(repository) {
  async function check(req, res) {
    try {
      await repository.getAll();
      return res.status(200).json({ status: 'ok' });
    } catch {
      return res.status(503).json({ status: 'unavailable' });
    }
  }

  return { check };
}

module.exports = {
  createHealthController,
};
