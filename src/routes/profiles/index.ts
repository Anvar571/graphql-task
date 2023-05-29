import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    ProfileEntity[]
  > {
    try {
      const profiles: ProfileEntity[] = await fastify.db.profiles.findMany();

      return profiles;
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
    async function (request, reply): Promise<ProfileEntity> {
      try {
        const profile: ProfileEntity | null = await fastify.db.profiles.findOne({ key: "id", equals: request.params.id });

        if (!profile) {
          throw fastify.httpErrors.notFound();
        }

        return profile;
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
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        const { memberTypeId, userId } = request.body;

        const existingProfile = await fastify.db.profiles.findOne({
          key: "userId",
          equals: userId,
        });
        if (existingProfile) {
          throw fastify.httpErrors.badRequest();
        }

        const type = await fastify.db.memberTypes.findOne({ key: "id", equals: memberTypeId });

        if (!type) {
          throw fastify.httpErrors.badRequest();
        }

        const profile: ProfileEntity = await fastify.db.profiles.create(request.body);

        return profile;
      } catch (error) {
        fastify.log.error(error);
        throw error;
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
    async function (request, reply): Promise<ProfileEntity> {
      try {
        const { id } = request.params;
        const profile: ProfileEntity | null = await fastify.db.profiles.findOne({ key: "id", equals: id });

        if (!profile) {
          throw fastify.httpErrors.badRequest();
        }

        const deletedprofile = await fastify.db.profiles.delete(id);

        return deletedprofile;
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
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        const { id } = request.params;
        const profileInfo = request.body;

        const profile: ProfileEntity | null = await fastify.db.profiles.findOne({
          key: 'id',
          equals: id
        });

        if (!profile) {
          throw fastify.httpErrors.badRequest(`profile with id:${id}`);
        }

        const changedprofile = await fastify.db.profiles.change(id, profileInfo);

        return changedprofile;
      } catch (error) {
        throw error;
      }
    }
  );
};

export default plugin;