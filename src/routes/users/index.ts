import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { PostEntity } from '../../utils/DB/entities/DBPosts';
import { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    try {
      const users: UserEntity[] = await fastify.db.users.findMany();

      return users;
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
    async function (request, reply): Promise<UserEntity> {
      try {
        const user: UserEntity | null = await fastify.db.users.findOne({ key: "id", equals: request.params.id });

        if (!user) {
          throw fastify.httpErrors.notFound();
        }

        return user;
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
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        const user: UserEntity = await fastify.db.users.create(request.body);

        return user;
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
    async function (request, reply): Promise<UserEntity> {
      try {
        const { id: deletedUserId } = request.params;
        const user: UserEntity | null = await fastify.db.users.findOne({ key: "id", equals: deletedUserId });

        if (!user) {
          throw fastify.httpErrors.badRequest();
        }

        // delete user subscribers
        const subscribers: UserEntity[] | null = await fastify.db.users.findMany({
          key: "subscribedToUserIds",
          inArray: deletedUserId,
        });

        subscribers.forEach(async (subscriber: UserEntity) => {
          const fromIndex: number = subscriber.subscribedToUserIds.findIndex((userItemId) => (
            userItemId === deletedUserId
          ));
  
          if (fromIndex === -1) {
            throw fastify.httpErrors.badRequest();
          }
  
          subscriber.subscribedToUserIds.splice(fromIndex, 1);
  
          await fastify.db.users.change(subscriber.id, {
            subscribedToUserIds: [...subscriber.subscribedToUserIds],
          });
        });

        // delete user posts
        const userPosts: PostEntity[] = await fastify.db.posts.findMany({
          key: "userId",
          equals: deletedUserId,
        });
        userPosts.forEach(async (post) => {
          await fastify.db.posts.delete(post.id);
        });

        // delete user profile
        const userProfile: ProfileEntity | null = await fastify.db.profiles.findOne({ key: 'userId', equals: deletedUserId });
        if (userProfile) {
          await fastify.db.profiles.delete(userProfile.id);
        }

        const deletedUser = await fastify.db.users.delete(deletedUserId);

        return deletedUser;
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        const { id } = request.params;
        const { userId } = request.body;

        const user: UserEntity | null = await fastify.db.users.findOne({
          key: 'id',
          equals: id
        });
        const toUser: UserEntity | null = await fastify.db.users.findOne({
          key: 'id',
          equals: userId,
        })

        if (!user || !toUser) {
          throw fastify.httpErrors.notFound('User not found');
        }

        const changedUser = await fastify.db.users.change(userId, {
          subscribedToUserIds: [...toUser.subscribedToUserIds, id],
        })

        return changedUser;
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        const { id } = request.params;
        const { userId } = request.body;

        const user: UserEntity | null = await fastify.db.users.findOne({
          key: 'id',
          equals: id
        });
        const fromUser: UserEntity | null = await fastify.db.users.findOne({
          key: 'id',
          equals: userId,
        })

        if (!user || !fromUser) {
          throw fastify.httpErrors.notFound('User not found');
        }

        const fromIndex: number = fromUser.subscribedToUserIds.findIndex((userItemId) => (
          userItemId === id
        ));

        if (fromIndex === -1) {
          throw fastify.httpErrors.badRequest();
        }

        fromUser.subscribedToUserIds.splice(fromIndex, 1);

        const changedUser = await fastify.db.users.change(userId, {
          subscribedToUserIds: [...fromUser.subscribedToUserIds],
        })

        return changedUser;
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
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        const { id } = request.params;
        const userInfo = request.body;

        const user: UserEntity | null = await fastify.db.users.findOne({
          key: 'id',
          equals: id
        });

        if (!user) {
          throw fastify.httpErrors.badRequest(`User with id:${id}`);
        }

        const changedUser = await fastify.db.users.change(id, userInfo);

        return changedUser;
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    }
  );
};

export default plugin;