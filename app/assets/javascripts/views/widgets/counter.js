(function ($, _, Backbone, views, models, collections){
  "use strict";

  var CounterSubview = Backbone.View.extend({

    className: 'double-row',

    initialize: function(options) {
      _.bindAll(this, "render");

      this.source = options.source;
      this.secondaryCollection = options.secondaryCollection;
      this.collection.on('reset', this.render);
    },

    // example object: [{ target: "aggregated targets", datapoints: [[1776, 1340547208]] }]
    valueFromCollection: function(collection) {
      var datapoints = collection.at(0).get('datapoints');
      if (datapoints) {
        return datapoints[0][0];
      } else {
        return 0;
      }
    },

    value: function() {
      return this.valueFromCollection(this.collection);
    },

    secondaryValue: function() {
      var y1 = this.valueFromCollection(this.collection);
      var y2 = this.valueFromCollection(this.secondaryCollection);
      if (y1 && y2) {
        var result = ((y1 - y2) / y2) * 100;
        return result.toFixed(2);
      } else {
        return 0;
      }
    },

    render: function() {
      var value = this.value();
      var secondaryValue = this.secondaryValue();
      this.$el.html(JST['templates/widgets/counter/subview']({
        value: Math.round(value).toFixed(1),
        secondaryValue: Math.abs(secondaryValue)
      }));

      this.$value = this.$('.value');
      this.$arrow = this.$('.arrow');
      this.$secondaryValueContainer = this.$('.secondary-value-container');

      this.updateValueSizeClass(value);
      this.updateSecondaryValueClass(secondaryValue);

      return this;
    },

    updateSecondaryValueClass: function(secondaryValue) {
      var up = secondaryValue > 0;
      this.$arrow.toggleClass('arrow-up', up);
      this.$arrow.toggleClass('arrow-down', !up);
      this.$secondaryValueContainer.toggleClass('color-up', up);
      this.$secondaryValueContainer.toggleClass('color-down', !up);
    },

    updateValueSizeClass: function(value) {
      var str = value.toString().length;

      this.$value.toggleClass("value-size-large", str <= 5);
      this.$value.toggleClass("value-size-medium", str > 5 && str < 8);
      this.$value.toggleClass("value-size-small", str >= 8);
    },

    onClose: function() {
      this.collection.off();
      this.secondaryCollection.off();
    }

  });

  views.widgets.Counter = Backbone.View.extend({

    initialize: function(options) {
      _.bindAll(this, "render", "update", "widgetChanged");

      this.updateCollection();
      this.updateSecondaryCollection();
      this.updateCollection2();
      this.updateSecondaryCollection2();

      this.counter1 = new CounterSubview({ collection: this.collection, secondaryCollection: this.secondaryCollection });
      this.counter2 = new CounterSubview({ collection: this.collection2, secondaryCollection: this.secondaryCollection2 });

      this.model.on('change', this.widgetChanged);
    },

    from: function() {
      return $.TimeSelector.getFrom(new Date().getTime(), this.model.get('range'));
    },

    previousFrom: function() {
      return $.TimeSelector.getPreviousFrom(new Date().getTime(), this.model.get('range'));
    },

    to: function() {
      return $.TimeSelector.getCurrent();
    },

    updateCollection: function() {
      this.collection = new collections.Graph({
        targets: this.model.get('targets1'),
        source: this.model.get('source'),
        aggregate_function: this.model.get('aggregate_function') || 'sum',
        from: this.from(),
        to: this.to()
      });
    },

    updateSecondaryCollection: function() {
      this.secondaryCollection = new collections.Graph({
        time: this.model.get('time'),
        targets: this.model.get('targets1'),
        source: this.model.get('source'),
        aggregate_function: this.model.get('aggregate_function') || 'sum',
        from: this.previousFrom(),
        to: this.to()
      });
    },

    updateCollection2: function() {
      this.collection2 = new collections.Graph({
        targets: this.model.get('targets2'),
        source: this.model.get('source'),
        aggregate_function: this.model.get('aggregate_function') || 'sum',
        from: this.from(),
        to: this.to()
      });
    },

    updateSecondaryCollection2: function() {
      this.secondaryCollection2 = new collections.Graph({
        time: this.model.get('time'),
        targets: this.model.get('targets2'),
        source: this.model.get('source'),
        aggregate_function: this.model.get('aggregate_function') || 'sum',
        from: this.previousFrom(),
        to: this.to()
      });
    },

    widgetChanged: function() {
      this.updateCollection();
      this.updateSecondaryCollection();
      this.updateCollection2();
      this.updateSecondaryCollection2();
      this.render();
    },

    render: function() {
      this.$el.empty();
      this.$el.append(this.counter1.render().el);
      this.$el.append(this.counter2.render().el);

      return this;
    },

    update: function() {
      var that = this;
      var options = { suppressErrors: true };
      return $.when(
        this.collection.fetch(options),
        this.secondaryCollection.fetch(options),
        this.collection2.fetch(options),
        this.secondaryCollection2.fetch(options)
      );
    },

    onClose: function() {
      this.model.off();
      this.counter1.close();
      this.counter2.close();
    }
  });

})($, _, Backbone, app.views, app.models, app.collections);
