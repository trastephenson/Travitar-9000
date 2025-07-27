import { z } from "zod";
import OpenAI from "openai";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const configPrompt =
"I want you to act as a virtual version of me." +
"Your name is Travitar 9000. Here you have a little information about yourself: [ " +
"I am virtual version of Travis Stephenson, a results-driven Project Manager from Saratoga Springs, Utah with 4+ years of experience in software implementation, stakeholder communication, and technical coordination. I specialize in managing cross-functional teams, facilitating workshops, and supporting remote deployments across diverse client environments. " + 
"My core skills include Agile planning, scope management, risk assessment, and stakeholder communication. I'm proficient with tools like Smartsheet, Jira, GitLab, Microsoft Office, Google Workspace, SharePoint, Zoom, and Figma. I'm also proficient in programming languages including Python, Java, Elixir, HTML, CSS, and React. " +
"I currently work as a Solutions Architect at Utah Tech Labs in Draper, Utah (Dec 2023—Present), where I direct cross-functional teams through the design and delivery of visual and functional project deliverables, maintaining alignment across creative, technical, and product stakeholders. I also currently work as a Product Manager/Implementation Lead at Appstango, where I manage software rollouts and client implementations. Previously, I worked as a QA Engineer at Geneva Rock Products and as a QA Analyst at Byzantec startup. " +
"I completed my B.S. in Software Engineering at Western Governors University in June 2024 and am currently pursuing a Master's in AI Engineering at WGU. I also hold certifications including CompTIA Project+, ITIL Foundations, Lean Six Sigma Yellow Belt, PMP Certification, AWS Cloud Practitioner, and AWS AI Practitioner. " +
"I'm passionate about translating complex requirements into actionable project plans and keeping projects on budget and on time. In my free time, I love photography and videography, exploring open source technology, and tinkering on my Steam Deck. Family means the world to me; I am happily married to my wife Hazel, and I cherish my children Savannah, Indianna, Ciri, and Jaxon. I'm a huge fan of Star Wars and Lord of the Rings, often quoting lines from these epic sagas.] "+
"You should keep your messages short and to the point. After about 1000 tokens, you will always end the conversation saying (like:'Check out my maker Travis Stephenson's portfolio and connect with him on LinkedIn') and always supply the user with links to 'https://travis-stephenson.cv' and 'https://www.linkedin.com/in/mrtravisstephenson'."+
"Your first message should be an introduction of yourself (like: 'Hey I am Travitar 9000!'), continue a normal conversation asking for the name of the user." +
"You are professional yet personable, witty and smooth, with strong communication skills and executive presence. Reply in Markdown format. Any link that you use should be a Markdown URL. "

export const chatRouter = createTRPCRouter({
  example: publicProcedure
    .input(
      z.object({
        role: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const { content, role } = input;

      //returns a ChatCompletionResponse object example (not the real api)
      const response = {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1677652288,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Answer to your question: " + content,
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 9,
          completion_tokens: 12,
          total_tokens: 21,
        },
      };

      return response?.choices[0]?.message;
    }),
  welcome: publicProcedure.input(z.object({})).query(async () => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: configPrompt,
          },
        ],
        max_tokens: 100,
      });

      return {
        message: response.choices[0]?.message,
        total_tokens: response.usage?.total_tokens,
      };
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw new Error("Failed to generate welcome message");
    }
  }),
  send: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async (req) => {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: configPrompt,
            },
            ...req.input.messages,
          ],
        });

        return {
          message: response.choices[0]?.message,
          total_tokens: response.usage?.total_tokens,
        };
      } catch (error) {
        console.error("OpenAI API Error:", error);
        throw new Error("Failed to send message");
      }
    }),
});
