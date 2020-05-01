'use strict';

/* global bootstrapModeler, inject, sinon */

var Modeler = require('../../../../lib/Modeler');

var TestContainer = require('mocha-test-container-support');

describe('label bounds', function() {

  function createModeler(xml, done) {
    var modeler = new Modeler({ container: container });

    modeler.importXML(xml, function(err, warnings) {
      done(err, warnings, modeler);
    });
  }

  var container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  describe('on import', function() {

    it('should import simple label process', function(done) {
      var xml = require('./LabelBoundsSpec.cmmn');
      createModeler(xml, done);
    });

  });


  describe('on label change', function() {

    var diagramXML = require('./LabelBoundsSpec.cmmn');

    beforeEach(bootstrapModeler(diagramXML));

    var updateLabel;

    beforeEach(inject(function(directEditing) {

      updateLabel = function(shape, text) {
        directEditing.activate(shape);
        directEditing._textbox.content.innerText = text;
        directEditing.complete();
      };

    }));


    describe('label dimensions', function() {

      it('should expand width', inject(function(elementRegistry) {

        // given
        var shape = elementRegistry.get('PlanItem_1');

        // when
        updateLabel(shape, 'Foooooooooobar');

        // then
        expect(shape.label.width).to.be.within(82, 88);
      }));


      it('should expand height', inject(function(elementRegistry) {

        // given
        var shape = elementRegistry.get('PlanItem_1');

        // when
        updateLabel(shape, 'Foo\nbar\nbaz');

        // then
        expect(shape.label.height).to.be.within(36, 45);
      }));


      it('should reduce width', inject(function(elementRegistry) {
        // given
        var shape = elementRegistry.get('PlanItem_1');

        // when
        updateLabel(shape, 'i');

        // then
        expect(shape.label.width).to.be.within(2, 4);
      }));


      it('should reduce height', inject(function(elementRegistry) {
        // given
        var shape = elementRegistry.get('PlanItem_3');

        // when
        updateLabel(shape, 'One line');

        // then
        expect(shape.label.height).to.be.within(12, 15);
      }));

    });


    describe('label position', function() {

      var getExpectedX = function(shape) {
        var shapeMid = shape.x + shape.width/2;

        return Math.round(shapeMid - shape.label.width/2);
      };

      it('should shift to left', inject(function(elementRegistry) {

        // given
        var shape = elementRegistry.get('PlanItem_1');

        // when
        updateLabel(shape, 'Foooooooooobar');

        // then
        var expectedX = getExpectedX(shape);

        expect(shape.label.x).to.be.within(expectedX - 1, expectedX);
      }));


      it('should shift to right', inject(function(elementRegistry) {

        // given
        var shape = elementRegistry.get('PlanItem_1');

        // when
        updateLabel(shape, 'F');

        // then
        var expectedX = getExpectedX(shape);

        expect(shape.label.x).to.be.within(expectedX -1, expectedX);
      }));

    });


    describe('label outlines', function() {

      it('should update after element bounds have been updated',
        inject(function(outline, elementRegistry, cmmnRenderer) {

          // given
          var shape = elementRegistry.get('PlanItem_1');

          var outlineSpy = sinon.spy(outline, 'updateShapeOutline');
          var rendererSpy = sinon.spy(cmmnRenderer, 'drawShape');

          // when
          updateLabel(shape, 'Fooooobar');

          // then
          // expect the outline updating to happen after the renderer
          // updated the elements bounds dimensions and position
          sinon.assert.callOrder(
            rendererSpy.withArgs(sinon.match.any, shape.label),
            outlineSpy.withArgs(sinon.match.any, shape.label)
          );
        })

      );

    });


    describe('interaction events', function() {

      it('should update bounds after element bounds have been updated',
        inject(function(interactionEvents, elementRegistry, cmmnRenderer) {

          // given
          var shape = elementRegistry.get('PlanItem_1'),
              gfx = elementRegistry.getGraphics('PlanItem_1_label'),
              hit = gfx.querySelector('.djs-hit');

          var interactionEventSpy = sinon.spy(hit, 'setAttributeNS'),
              rendererSpy = sinon.spy(cmmnRenderer, 'drawShape');

          // when
          updateLabel(shape, 'Fooooobar');

          // then
          // expect the interaction event bounds updating to happen after the renderer
          // updated the elements bounds dimensions and position
          sinon.assert.callOrder(
            rendererSpy.withArgs(sinon.match.any, shape.label),
            interactionEventSpy
          );
        })
      );

    });

  });


  describe('on export', function() {

    it('should create DI when label has changed', function(done) {

      var xml = require('./LabelBoundsSpec.cmmn');

      createModeler(xml, function(err, warnings, modeler) {

        if (err) {
          return done(err);
        }

        var elementRegistry = modeler.get('elementRegistry'),
            directEditing = modeler.get('directEditing');

        var shape = elementRegistry.get('PlanItem_1');

        directEditing.activate(shape);
        directEditing._textbox.content.innerText = 'BARBAZ';
        directEditing.complete();

        modeler.saveXML({ format: true }, function(err, result) {

          if (err) {
            return done(err);
          }

          // strip spaces and line breaks after '>'
          result = result.replace(/>\s+/g,'>');

          // get label width and height from XML
          var matches = result.match(/PlanItem_1_di.*?CMMNLabel.*?width="(\d*).*?height="(\d*)/);

          var width = parseInt(matches[1]),
              height = parseInt(matches[2]);

          expect(width).to.be.within(43, 47);
          expect(height).to.be.within(12, 15);

          done();
        });
      });
    });


    it('should update existing DI when label has changed', function(done) {

      var xml = require('./LabelBoundsSpec.cmmn');

      createModeler(xml, function(err, warnings, modeler) {

        if (err) {
          return done(err);
        }

        var elementRegistry = modeler.get('elementRegistry'),
            directEditing = modeler.get('directEditing');

        var shape = elementRegistry.get('PlanItem_3');

        directEditing.activate(shape);
        directEditing._textbox.content.innerText = 'BARBAZ';
        directEditing.complete();

        modeler.saveXML({ format: true }, function(err, result) {

          if (err) {
            return done(err);
          }

          // strip spaces and line breaks after '>'
          result = result.replace(/>\s+/g,'>');

          // get label width and height from XML
          var matches = result.match(/PlanItem_3_di.*?CMMNLabel.*?width="(\d*).*?height="(\d*)/);

          var width = parseInt(matches[1]),
              height = parseInt(matches[2]);

          expect(width).to.be.within(43, 47);
          expect(height).to.be.within(12, 15);

          done();
        });
      });
    });


    it('should not update DI of untouched labels', function(done) {

      var xml = require('./LabelBoundsSpec.cmmn');

      createModeler(xml, function(err, warnings, modeler) {

        if (err) {
          return done(err);
        }

        modeler.saveXML({ format: true }, function(err, result) {

          if (err) {
            return done(err);
          }

          expect(result).to.equal(xml);

          done();
        });
      });
    });

  });

});