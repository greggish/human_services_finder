// handles search filter toggle functionality
define(
	function() {
  'use strict';

  	// PRIVATE PROPERTIES
  	var _fieldsets = {}; // set of all fieldsets

  	// main module initialization
  	function init()
  	{
			// capture form submission
			var searchForm = document.getElementById("search-form");
			searchForm.addEventListener("submit",_formSubmitted,false);

			var resetBtn = document.getElementById("reset-btn-link");
			resetBtn.addEventListener("click",_resetClicked,false);

			// initialize fieldsets
			var fieldsets = document.querySelectorAll('#search-box fieldset');
			var numFieldsets = fieldsets.length;
			var fs; // individual fieldset

			// instantiate new fieldset objects and place in set of fieldsets
			for (var f = 0; f < numFieldsets; f++)
			{
	      fs = new Fieldset();
	      fs.init(fieldsets[f]);
	      _fieldsets[fs.getId()] = fs;
	    }
  	}

  	function _resetClicked(evt)
  	{
  		for (var f in _fieldsets)
  		{
  			_fieldsets[f].reset()
  		}

  		evt.preventDefault();
  		return false;
  	}

  	// Handle form submission
  	function _formSubmitted(evt)
		{
			var form = evt.target;
			var input;

			for (var f in _fieldsets)
			{
				input = _fieldsets[f].getSelectedToggle();
				if (input.isAddToggle())
					input = input.getAddInput();
				else
					input = input.getToggle()

				_fieldsets[f].getHidden().value = input.value;
				input.disabled = true;
			}

			var count = 0;
			while(form[count] != undefined)
			{
				input = form[count++];
				if (input.value == "" || (input.type == "radio" || input.type == "checkbox"))
					input.disabled = true;
			}

			form.submit();
			evt.preventDefault();
			return false;
		}

		// New ToggleGroup instance constructor
  	var ToggleGroup = function()
  	{
  		var _group; // the group around a toggle
			var _toggle; // the actual toggle input element (radio or checkbox)
			var _label; // the toggle's label element

			var _isCurrentToggle = false;
			var _isAddToggle = false; // the add toggle (if present)
			var _addInput; // the add input text field
			var _addInputLabel; // the add input label
			var _addInputShowing = false; // whether or not the add input field is showing

			function init(tGroup)
			{
				_group = tGroup;
				_toggle = _group.querySelector(".toggle input");
				_label = _group.querySelector("div+label");

				_addInput = _label.querySelector("input");
				_isAddToggle = (_addInput) ? true : false;

				if (_isAddToggle)
					_addInputLabel = _label.querySelector("span");
				else
					_isCurrentToggle = (_group.parentNode.classList.contains("current-option"));
			}

			// Show the add input text field.
			function showAddInput()
			{
				if (_isAddToggle && !_addInputShowing)
				{
					_addInputLabel.classList.add('hide'); // hide "Add..." text
					_addInput.classList.remove('hide'); // show input field
					_addInputShowing = true;
					setTimeout(function() { _addInput.focus(); }, 0);
				}
			}

			// Hide the add input text field.
			function hideAddInput()
			{
				if (_isAddToggle && _addInputShowing)
				{
					_addInput.value = ""; // clear input field value
					_addInput.classList.add('hide'); // hide input field
					_addInputLabel.classList.remove('hide'); // show "Add..." text
					_addInputShowing = false;
				}
			}

			// Set the label's text value.
			function setLabel(value)
			{
				if (_isAddToggle)
					_addInputLabel.innerHTML = value;
				else
					_label.innerHTML = value;
			}

			// GETTERS
			function getToggle()
			{
				return _toggle;
			}

			function getAddInput()
			{
				return _addInput;
			}

			function isAddToggle()
			{
				return _isAddToggle;
			}

			function addInputShowing()
			{
				return _addInputShowing;
			}

			return {
				init:init,
				isAddToggle:isAddToggle,
				showAddInput:showAddInput,
				hideAddInput:hideAddInput,
				setLabel:setLabel,
				getToggle:getToggle,
				getAddInput:getAddInput,
				addInputShowing:addInputShowing
			};
  	}

		// New Fieldset instance constructor
  	var Fieldset = function() {

  		// fieldset components
  		var _fieldset; // the fieldset element
  		var _id; // the fieldset element's id
  		var _legend; // the fieldset's legend
  		var _toggleGroupContainers; // the container for all toggles
  		var _toggleGroups = {}; // array of toggles radio-groups

  		var _highlightToggle; // the currently shown toggle when fieldset is closed
  		var _defaultToggle; // the "All" toggle
  		var _selectedToggle; // the currently selected toggle
  		var _addInputToggle; // add input toggle

  		var _hidden; // the fieldset's hidden input that's used for form submission

			function init(fieldset)
			{
				_fieldset = fieldset;
				_id = _fieldset.id;

				_legend = _fieldset.querySelector("legend");

				_toggleGroupContainers 		= _fieldset.querySelectorAll(".options");
				_hidden 									= _fieldset.querySelector("input[type=hidden]");

				var container;
				var groups;
				var group;
				var toggle;

				for (var c = 0; c < _toggleGroupContainers.length; c++)
				{
					groups = _toggleGroupContainers[c].querySelectorAll(".toggle-group");
					for (var g = 0; g < groups.length; g++)
					{
						group = groups[g];
						toggle = new ToggleGroup();
						toggle.init(group);
						_toggleGroups[group.id] = toggle;
						if (toggle.getToggle().checked && c>0)
							_selectedToggle = toggle;

						group.addEventListener("mousedown",_toggleClicked,false);
					}
					_highlightToggle = _highlightToggle || _toggleGroups[groups[0].id];
				}

				_defaultToggle = _toggleGroups[groups[0].id];

				var addInputToggle = _toggleGroups[groups[groups.length-1].id];
				_addInputToggle = addInputToggle.isAddToggle() ? addInputToggle : null;

				// setup event listeners
				_legend.addEventListener('mousedown',_legendClicked,false);
			}

			// EVENT HANDLERS
			// The legend was clicked.
			function _legendClicked(evt)
			{
				_toggleFilter();
			}

			// Toggle clicked event handler.
			function _toggleClicked(evt)
			{
				var current = evt.target; // the current clicked target
				var toggleGroup = _toggleGroups[evt.currentTarget.id]; // the current toggle group

				var toggle = toggleGroup.getToggle(); // the current toggle input

				// Whether the toggle input or associated label was clicked or not.
				var toggleClicked = (toggle == current || current.getAttribute("for") == toggle.id);

				// If the toggle was not directly clicked, then some other element
				// (such as a div) was clicked in the toggle group, so we need
				// to manually switch the checked state of the toggle.
				// Logic to handle radio buttons and checkboxes differs slightly
				// as clicking a radio button will always set checked to true
				// whereas clicking a check box will toggle its value.
				if (!toggleClicked)
				{
					if (toggle.type == "radio")
						toggle.checked = true;
					else if (toggle.type == "checkbox")
						toggle.checked = !toggle.checked;
				}


				// Toggle filters.
				if (toggleGroup == _highlightToggle)
				{
					_toggleFilter();
				}
				else if (toggleGroup == _addInputToggle)
				{
					_toggleAddInputFilter(current);
				}
				else if (toggleGroup == _selectedToggle)
				{
					_toggleFilter();
				}
				else
				{
					_selectedToggle = toggleGroup;

					// hide add input if selected toggle is not the add input toggle
					if (_addInputToggle && _selectedToggle != _addInputToggle)
						_addInputToggle.hideAddInput();
				}

			}


			// Toggle visible toggle group container. Which means either the
			// currently selected toggle or list of toggles will be visible.
			function _toggleFilter()
			{
				if (_legend.className == 'open')
				{
					// Check if add input value has a value.
					// If it doesn't and the add input toggle is selected
					// uncheck the selected toggle and check the "All"
					// toggle and set the selected toggle to "All".
					var inputVal;
					if (_addInputToggle)
					{
						inputVal = _addInputToggle.getAddInput().value;
						if (_selectedToggle == _addInputToggle && inputVal == "")
						{
							_selectedToggle.getToggle().checked = false;
							_selectedToggle.hideAddInput();
							_selectedToggle = _defaultToggle;
							_defaultToggle.getToggle().checked = true;
						}
					}

					var toggle = _selectedToggle.getToggle();
					_highlightToggle.setLabel(
						toggle.getAttribute("data-display-value") ||
						inputVal ||
						toggle.value ||
						"All");

					_toggleGroupContainers[1].classList.add('hide');
					_toggleGroupContainers[0].classList.remove('hide');
					_legend.className = 'closed';
				}
				else
				{
					_toggleGroupContainers[1].classList.remove('hide');
					_toggleGroupContainers[0].classList.add('hide');
					_legend.className = 'open';
				}
			}

			function _toggleAddInputFilter(clicked)
			{
				if (_selectedToggle == _addInputToggle)
				{
					if (clicked.type != "search")
						_toggleFilter();
				}
				else
				{
					_selectedToggle = _addInputToggle;
					_selectedToggle.showAddInput();
				}
			}


			function reset()
			{
				_defaultToggle.checked = true;
				_selectedToggle.checked = false;
				_selectedToggle = _defaultToggle;

				var toggle = _defaultToggle.getToggle();
				_highlightToggle.setLabel(
						toggle.getAttribute("data-display-value") ||
						"All");

				document.getElementById("keyword").value = "";
			}

			// GETTERS
			// Publicly exposed getters for properties
			function getId()
			{
				return _id;
			}

			function getSelectedToggle()
			{
				return _selectedToggle;
			}

			function getHidden()
			{
				return _hidden;
			}

    return {
      init:init,
      getId:getId,
      getSelectedToggle:getSelectedToggle,
      getHidden:getHidden,
      reset:reset
    };

  };

	return {
		init:init
	};
});