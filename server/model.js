Predictions = new Meteor.Collection("predictions");

Meteor.publish("Predictions", function(){
//    return Predictions.find({},{});
    return Predictions.find({},{limit:1000});
});
