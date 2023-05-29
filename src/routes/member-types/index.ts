import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    try {
      const types: MemberTypeEntity[] = await fastify.db.memberTypes.findMany();

      return types;
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
    async function (request, reply): Promise<MemberTypeEntity> {
      try {
        const type: MemberTypeEntity | null = await fastify.db.memberTypes.findOne({ key: "id", equals: request.params.id });

        if (!type) {
          throw fastify.httpErrors.notFound();
        }

        return type;
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
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      try {
        const { id } = request.params;
        const typeInfo = request.body;

        const type: MemberTypeEntity | null = await fastify.db.memberTypes.findOne({
          key: 'id',
          equals: id
        });

        if (!type) {
          throw fastify.httpErrors.badRequest(`User with id:${id}`);
        }

        const changedType = await fastify.db.memberTypes.change(id, typeInfo);

        return changedType;
      } catch (error) {
        throw error;
      }
    }
  );
};

export default plugin;