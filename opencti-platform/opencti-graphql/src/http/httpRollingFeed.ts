/* eslint-disable camelcase */
import * as R from 'ramda';
import type Express from 'express';
import { authenticateUserFromRequest, TAXIIAPI } from '../domain/user';
import { basePath } from '../config/conf';
import { AuthRequired, ForbiddenAccess } from '../config/errors';
import { BYPASS } from '../utils/access';
import { findById as findFeed } from '../domain/feed';
import type { AuthUser } from '../types/user';
import { listThings } from '../database/middleware';
import { minutesAgo } from '../utils/format';
import { isNotEmptyField } from '../database/utils';
import { convertFiltersToQueryOptions } from '../utils/filtering';
import { isDictionaryAttribute, isMultipleAttribute } from '../schema/fieldDataAdapter';

const errorConverter = (e: any) => {
  const details = R.pipe(R.dissoc('reason'), R.dissoc('http_status'))(e.data);
  return {
    title: e.message,
    error_code: e.name,
    description: e.data?.reason,
    http_status: e.data?.http_status || 500,
    details,
  };
};
const userHaveAccess = (user: AuthUser) => {
  const capabilities = user.capabilities.map((c) => c.name);
  return capabilities.includes(BYPASS) || capabilities.includes(TAXIIAPI);
};
const extractUserFromRequest = async (req: Express.Request, res: Express.Response) => {
  const user = await authenticateUserFromRequest(req, res);
  if (!user) {
    res.setHeader('WWW-Authenticate', 'Basic, Bearer');
    throw AuthRequired();
  }
  if (!userHaveAccess(user)) throw ForbiddenAccess();
  return user;
};

const escape = (str: string) => R.replace(/"/g, '"""', str);

const initHttpRollingFeeds = (app: Express.Application) => {
  app.get(`${basePath}/feeds/:id`, async (req: Express.Request, res: Express.Response) => {
    const { id } = req.params;
    try {
      const user = await extractUserFromRequest(req, res);
      const feed = await findFeed(user, id);
      const filters = feed.filters ? JSON.parse(feed.filters) : undefined;
      const fromDate = minutesAgo(feed.rolling_time);
      const extraOptions = { defaultTypes: feed.feed_types, field: 'created_at', orderMode: 'desc', after: fromDate };
      const options = convertFiltersToQueryOptions(filters, extraOptions);
      const args = { connectionFormat: false, first: 5000, ...options };
      const elements = await listThings(user, feed.feed_types, args);
      if (feed.include_header) {
        res.write(`${feed.feed_attributes.map((a) => a.attribute).join(',')}\r\n`);
      }
      for (let index = 0; index < elements.length; index += 1) {
        const element = elements[index];
        const dataElements = [];
        for (let attrIndex = 0; attrIndex < feed.feed_attributes.length; attrIndex += 1) {
          const attribute = feed.feed_attributes[attrIndex];
          const mapping = attribute.mappings.find((f) => f.type === element.entity_type);
          if (mapping) {
            const data = element[mapping.attribute];
            if (isNotEmptyField(data)) {
              if (isMultipleAttribute(mapping.attribute)) {
                dataElements.push(`"${escape(data.join(','))}"`);
              } else if (isDictionaryAttribute(mapping.attribute)) {
                dataElements.push(`"${escape(JSON.stringify(data))}"`);
              } else {
                dataElements.push(`"${escape(data)}"`);
              }
            } else {
              dataElements.push('""');
            }
          }
        }
        res.write(dataElements.join(feed.separator ?? ','));
        res.write('\r\n');
      }
      res.send();
    } catch (e) {
      const errorDetail = errorConverter(e);
      res.status(errorDetail.http_status).send(errorDetail);
    }
  });
};

export default initHttpRollingFeeds;
