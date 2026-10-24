import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export async function fetchRSSFeed(feedURL: string): Promise<RSSFeed> {
 const response = await fetch(feedURL, {
  headers: {
    "User-Agent" : "gator",
  },
});

const xml = await response.text();

const parser = new XMLParser({ processEntities: false });
const parsed = parser.parse(xml);
const channel = parsed.rss.channel;
const title = channel.title;
const link = channel.link;
const description = channel.description;
const item = channel.item;

return {
  channel: {
    title,
    link,
    description,
    item: item,
  },
};

}