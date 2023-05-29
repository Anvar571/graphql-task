import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    try {
      const posts: PostEntity[] = await fastify.db.posts.findMany();

      return posts;
    } catch (error) {
      fastify.log.error(error);
      throw error;
    }
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      try {
        const post: PostEntity | null = await fastify.db.posts.findOne({ key: "id", equals: request.params.id });

        if (!post) {
          throw fastify.httpErrors.notFound();
        }

        return post;
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply) {
      try {
        const post: PostEntity = await fastify.db.posts.create(request.body);

        return post;
      } catch (error) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply) {
      try {
        const { id } = request.params;
        const post: PostEntity | null = await fastify.db.posts.findOne({ key: "id", equals: id });

        if (!post) {
          throw fastify.httpErrors.badRequest();
        }

        const deletedPost = await fastify.db.posts.delete(id);

        return deletedPost;
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply) {
      try {
        const { id } = request.params;
        const postInfo = request.body;

        const post: PostEntity | null = await fastify.db.posts.findOne({
          key: 'id',
          equals: id
        });

        if (!post) {
          throw fastify.httpErrors.badRequest(`post with id:${id}`);
        }

        const changedPost = await fastify.db.posts.change(id, postInfo);

        return changedPost;
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    }
  );
};

export default plugin;