Ext.define('Rally.data.lookback.SnapshotRestProxyOverride', {
    override: 'Rally.data.lookback.SnapshotRestProxy', 
    timeout: 300000
});

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        this.add({
            xtype: 'rallymilestonecombobox',
            width: 200,
            height: 22,
            // stateful: true,
            // stateId: this.getContext().getScopedStateId('milestone'),
            context: this.getContext(),
            listeners: {
                ready: this._milestoneAvailable,
                select: this._milestoneSelected,
                scope: this
            }
        });
    },

    _milestoneAvailable: function() {
        Ext.create('Rally.data.wsapi.Store', {
            model: 'TypeDefinition',
            fetch: ['TypePath'],
            filters: [
                {
                    property: 'Parent.Name',
                    value: 'Portfolio Item'
                },
                {
                    property: 'Ordinal',
                    value: 0
                }
            ]
        }).load().then({
            success: function(records) {
              this.piType = records[0].get('TypePath');
              this._milestoneSelected();
            },
            scope: this
        });
    },

    _milestoneSelected: function() {
       Ext.create('Rally.data.wsapi.Store', {
            model: this.piType,
            fetch: ['ObjectID', 'Project', 'Name', 'PreliminaryEstimate', 'ActualStartDate', 'PlannedEndDate'],
            filters: [
                {
                   property: 'Milestones',
                   operator: 'contains',
                   value: this.down('rallymilestonecombobox').getValue()
                }
            ],
            context: {
                project: null
            },
            limit: Infinity
        }).load().then({
            success: function(piRecords) {
                this.piRecords = piRecords;
                this._showChart();
            },
            scope: this
        });
    },

    _showChart: function() {
        if(this.down('rallychart')) {
            this.down('rallychart').destroy();
        }

        this.add({
            xtype: 'rallychart',
            storeType: 'Rally.data.lookback.SnapshotStore',
            storeConfig: this._getStoreConfig(),
            calculatorType: 'Calculator',
            calculatorConfig: {
                stateFieldName: 'c_KanbanState',
                doneStateFieldValues: ['Accepted']
            },
            chartConfig: this._getChartConfig()
        });
    },

    _getChartConfig: function() {
        return {
            chart: {
                defaultSeriesType: 'area',
                zoomType: 'xy'
            },
            title: {
                text: 'PI Burnup'
            },
            xAxis: {
                categories: [],
                tickmarkPlacement: 'on',
                tickInterval: 5,
                title: {
                    text: 'Date',
                    margin: 10
                }
            },
            yAxis: [
                {
                    title: {
                        text: 'Points'
                    }
                }
            ],
            tooltip: {
                formatter: function() {
                    return '' + this.x + '<br />' + this.series.name + ': ' + this.y;
                }
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    },
                    groupPadding: 0.01
                },
                column: {
                    stacking: null,
                    shadow: false
                }
            }
        };
    },

    _getStoreConfig: function() {
         return {
            find: {
                _TypeHierarchy: { '$in': [ 'HierarchicalRequirement', 'Defect'] },
                _ItemHierarchy: { '$in': _.invoke(this.piRecords, 'getId')},
                Children: null,
                _ProjectHierarchy: this.getContext().getProject().ObjectID
            },
            fetch: ['c_KanbanState', 'PlanEstimate'],
            sort: {
                _ValidFrom: 1
            },
            context: this.getContext().getDataContext(),
            limit: Infinity
        };
    }
});
