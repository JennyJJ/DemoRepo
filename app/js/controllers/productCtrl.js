four51.app.controller('LineItemEditCtrl', function ($routeParams, $scope, ProductService,ProductDisplayService, OrderService, VariantService, $451, UserService) {
	$scope.LineItem = {};
	var user = UserService.get();
	OrderService.get(user.CurrentOrderID, function(data){
		$scope.LineItem = data.LineItems[$routeParams.lineItemIndex];
		$scope.LineItem.Product = ProductService.get({interopID: $scope.LineItem.Product.InteropID}, function(data){
			ProductDisplayService.setProductViewScope($scope);
		});
		$scope.allowAddToOrder = true;
	});
});

four51.app.controller('shortProductViewCtrl', function ($routeParams, $scope, ProductService,ProductDisplayService, OrderService, VariantService, $451) {
	$scope.LineItem = {};
	$scope.LineItem.Product = $scope.p;
	ProductDisplayService.setNewLineItemScope($scope);
	ProductDisplayService.setProductViewScope($scope);
	$scope.allowAddToOrderInProductList = $scope.allowAddToOrder && $scope.LineItem.Specs.length == 0 && $scope.LineItem.Product.Type != 'VariableText';
});

four51.app.controller('ProductCtrl', function ($routeParams, $scope, ProductService,ProductDisplayService, OrderService, VariantService, $451) {
	$scope.LineItem = {};
	$scope.LineItem.Product = ProductService.get({interopID: $routeParams.productInteropID}, function(data){
        var v = null;
        if($routeParams.variantInteropID){
			//Product.Variants doesn't return all details on variable text products, so go back for the rest.
			$scope.LineItem.Variant = data.Type == 'VariableText' ?
				VariantService.get({VariantInteropID: $routeParams.variantInteropID, ProductInteropID: data.InteropID }) :
				$451.filter(data.Variants, {Property: 'InteropID', Value: $routeParams.variantInteropID})[0];

		}
		ProductDisplayService.setNewLineItemScope($scope);
		ProductDisplayService.setProductViewScope($scope);
		$scope.$broadcast('ProductGetComplete');
	});

	$scope.addToOrder = function(quantity, productInteropID, variantInteropID){
		OrderService.addToOrder(quantity, productInteropID, variantInteropID);
	}
});

four51.app.controller('CustomProductCtrlMatrix', function($scope, $451, VariantService, ProductDisplayService){
	//just a little experiment on extending the product view
	$scope.matrixLineTotal = 0;
	$scope.LineItems = {};
	$scope.LineKeys = [];
	$scope.lineChanged = function(){
		var addToOrderTotal = 0;
		angular.forEach($scope.LineKeys, function(key){
			if($scope.LineItems[key].Variant){
				ProductDisplayService.calculateLineTotal($scope.LineItems[key]);
				addToOrderTotal += $scope.LineItems[key].LineTotal;
			}
		$scope.matrixLineTotal = addToOrderTotal;

		});
	};
	$scope.addMatrixToOrder = function(){
	};
	$scope.setFocusVariant = function(opt1, opt2){

		if($scope.LineItems[opt1.Value.toString() + opt2.Value.toString()].Variant){
			$scope.LineItem.Variant = $scope.LineItems[opt1.Value.toString() + opt2.Value.toString()].Variant;
			return;
		}

		VariantService.get({'ProductInteropID': $scope.LineItem.Product.InteropID, 'SpecOptionIDs': [opt1.ID, opt2.ID]}, function(data){
			var li = $scope.LineItems[opt1.Value.toString() + opt2.Value.toString()];
			li.Variant = data;
			//for line item calc if spec markups used
			li.Specs.push({CanSetForLineItem:$scope.matrixSpec1.CanSetForLineItem,  MarkupType: $scope.matrixSpec1.MarkupType, SelectedOptionID: opt1.ID, Options: [opt1]  });
			li.Specs.push({CanSetForLineItem:$scope.matrixSpec2.CanSetForLineItem, MarkupType: $scope.matrixSpec2.MarkupType, SelectedOptionID: opt2.ID, Options: [opt2]  });
			$scope.LineItem.Variant = data;
		});
	};
	$scope.$watch("LineItems", function(){
		$scope.lineChanged();
	}, true);

	$scope.$on('ProductGetComplete', function(){
		var specs = $451.filter($scope.LineItem.Product.Specs, {Property: 'DefinesVariant', Value: true});
		$scope.matrixSpec1 = specs[0];
		$scope.matrixSpec2 = specs[1];
		angular.forEach(specs[0].Options, function(option1){
			angular.forEach(specs[1].Options, function(option2){
				var specs = [];
				angular.forEach($scope.LineItem.Specs, function(item){
					specs.push(item);
				});//copy specs so each line item has its own reference
				$scope.LineKeys.push(option1.Value.toString() + option2.Value.toString());
				$scope.LineItems[option1.Value.toString() + option2.Value.toString()] = {
					Product: $scope.LineItem.Product,
					PriceSchedule: $scope.LineItem.PriceSchedule,
					Specs: specs
				};
			});
		});
	});
});
