export function recommendForQuery(query: string, apiKey?: string): Promise<Record<string, any>>
export function createRecommendHandler(apiKey?: string): (req: any, res: any, next: any) => Promise<void>
