export class RuleProvider {
    calculateCombinedCost(terrain, options) {
        let calculate = options.calculate || "maximum";
        let calculateFn;
        if (typeof calculate == "function") {
            calculateFn = calculate;
        } else {
            switch (calculate) {
                case "maximum":
                    calculateFn = function (cost, total) {
                        return Math.max(cost, total);
                    };
                    break;
                case "additive":
                    calculateFn = function (cost, total) {
                        return cost + total;
                    };
                    break;
                default:
                    throw new Error(i18n("EnhancedTerrainLayer.ErrorCalculate"));
            }
        }

        let total = null;
        for (const terrainInfo of terrain) {
            if (typeof calculateFn == "function") {
                total = calculateFn(terrainInfo.cost, total, terrainInfo.object);
            }
        }
        return total ?? 1;
    }

    /**
     * Constructs a new instance of the speed provider
     *
     * This function should neither be called or overridden by rule provider implementations
     */
    constructor(id) {
        this.id = id;
    }
}
