
/**
 * @ngdoc filter
 * @name phone-number
 * @kind function
 * @version v1.2.3
 * @description
 * filters a user typed phone number into a formatted number
 *
 */
/* global phoneUtils, angular */

angular.module('cwill747.phonenumber', [])
  .directive('phoneNumber', ['$log', function($log) {
      function clearValue(value) {
        if (!value) {
          return value;
        }
        return value.replace(/([^0-9|+])/g, '');
      }

      function applyPhoneMask(value, region) {
        var phoneMask = value;
        try {
          phoneMask = phoneUtils.formatAsTyped(value, region);
        }
        catch (err) {
          $log.debug(err);
        }
        return phoneMask;
      }

      return {
        restrict: 'A',
        require: '?ngModel',
        scope: {
          countryCode: '=',
          nonFormatted: '=?',
          phoneType: '=',
          countryNumber: '='
        },
        controllerAs: '',
        controller: function() {
          this.countryCode = this.countryCode || 'us';
        },
        link: function(scope, element, attrs, ctrl) {
          var el = element[0];
          scope.$watch('countryCode', function() {
            ctrl.$modelValue = ctrl.$viewValue + ' ';
          });
          scope.$watch('countryNumber', function() {
            ctrl.$modelValue = ctrl.$viewValue + ' ';
          });

          function clean (value) {
            var cleanValue = clearValue(value);
            scope.nonFormatted = cleanValue;
            var formattedValue = '';
            if (cleanValue && cleanValue.length > 1) {
              formattedValue = applyPhoneMask(cleanValue, scope.countryCode);
            }
            else {
              formattedValue = cleanValue;
            }
            return formattedValue.trim();
          }

          function formatter(value) {
            if (ctrl.$isEmpty(value)) {
              return value;
            }
            return applyPhoneMask(clearValue(value), scope.countryCode);
          }

          function parser(value) {
            if (ctrl.$isEmpty(value)) {
              scope.nonFormatted = '';
              return value;
            }

            var formattedValue = clean(value);
            if (formattedValue === value) {
              return value;
            }
            var start = el.selectionStart;
            var end = el.selectionEnd + formattedValue.length - value.length;

            if (value.length < formattedValue.length) {
              // shift the start by the difference
              start = start + (formattedValue.length - value.length);
            }
            if (value.length > formattedValue.length + 1) {
              start = start - (formattedValue.length - value.length);
            }
            // element.val(cleaned) does not behave with
            // repeated invalid elements
            ctrl.$setViewValue(formattedValue);
            ctrl.$render();

            el.setSelectionRange(start, end);
            //return cleaned;
            return clearValue(formattedValue);
          }

          function mobileValidator (value) {
            var isMobilePhone = false;
            var getNumberType = '';
            try {
              if (value && (scope.countryCode === 'TT' || scope.countryCode === 'DO')) {
                value = scope.countryNumber + value;
              }
              getNumberType = phoneUtils.getNumberType(value, scope.countryCode);
              if (getNumberType === 'MOBILE' || getNumberType === 'FIXED_LINE_OR_MOBILE') {
                isMobilePhone = true;
              }
            }
            catch (err) {
              $log.debug(err);
            }
            var valid = ctrl.$isEmpty(value) || isMobilePhone;
            return valid;
          }

          function phoneValidator (value) {
            var isValidForRegion = false;
            try {
              isValidForRegion = phoneUtils.isValidNumberForRegion(value, scope.countryCode);
            }
            catch (err) {
              $log.debug(err);
            }
            var valid = ctrl.$isEmpty(value) || isValidForRegion;
            return valid;
          }

          function validator(value) {
            var valid = false;

            if (scope.phoneType === 'mobile') {
              valid = mobileValidator(value);
            } else {
              valid = phoneValidator(value);
            }
            ctrl.$setValidity('phoneNumber', valid);
            return value;
          }

          ctrl.$formatters.push(formatter);
          ctrl.$formatters.push(validator);
          ctrl.$parsers.push(parser);
          ctrl.$parsers.push(validator);
        }
      };

    }]);
