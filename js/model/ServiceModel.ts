export const EXPRESSION_VALUE_PLACEHOLDER = '${X}'

export type Service = {
    serviceName: string
    basePrice: number
    variations: {}              // A mapping of specific service param to its price variations
    staticRules: StaticRule[]
}

export type VariationRule = {
    /**
     * Expressions must be given when the incoming value is represented by ${X} so that the rule evaluation can replace it with an actual value
     * The second constraint is that they must evaluate to true/false
     */
    expression: string
    price: number
    rank: number                // In case more then one variation rule matches we can use rank to decide which variation wins
}

export type StaticRule = {
    expression: string
    param: any
    priceChange: number         // Percent to multiply by to apply discount/surcharge
}