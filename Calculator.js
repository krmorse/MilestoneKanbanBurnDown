Ext.define('Calculator', {
    extend: 'Rally.data.lookback.calculator.TimeSeriesCalculator',

    config: {
       stateFieldName: 'c_KanbanState',
       doneStateFieldValues: ['Accepted']
    },

    constructor: function(config) {
        this.initConfig(config);
        this.callParent(arguments);
    },

    getDerivedFieldsOnInput: function() {
        var completedValues = this.getDoneStateFieldValues();
        return [
            {
                as: 'Planned',
                f: function(snapshot) {
                    if (snapshot.PlanEstimate) {
                        return snapshot.PlanEstimate; //based on points
                        //return 1; //based on story count
                    }

                    return 0;
                }
            },
            {
                as: 'Completed',
                f: function(snapshot) {
                    if (_.contains(completedValues, snapshot.c_KanbanState) && 
                      snapshot.PlanEstimate) {
                        return snapshot.PlanEstimate; //based on points
                        //return 1; //based on story count
                    }

                    return 0;
                }
            }
        ];
    },

    getMetrics: function() {
        return [
            {
                field: 'Planned',
                as: 'Planned',
                display: 'line',
                f: 'sum'
            },
            {
                field: 'Completed',
                as: 'Completed',
                f: 'sum',
                display: 'column'
            }
        ];
    }
});
