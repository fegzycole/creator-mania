const repositoryFactory = require('@app-core/repository-factory');

const repository = repositoryFactory('CreatorCard');

async function create(data) {
  return repository.create(data);
}

async function findBySlug(slug) {
  return repository.findOne({ query: { slug } });
}

async function findActiveBySlug(slug) {
  return repository.findOne({ query: { slug, deleted: null } });
}

async function markDeletedBySlug(slug, deleted) {
  return repository
    .raw()
    .findOneAndUpdate(
      { slug, deleted: null },
      { $set: { deleted, updated: deleted } },
      { new: true, lean: true }
    );
}

module.exports = {
  create,
  findBySlug,
  findActiveBySlug,
  markDeletedBySlug,
};
