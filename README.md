# stylecow plugin extend

Stylecow plugin to work with @extend using the [syntax proposed by Tab Atkins](http://tabatkins.github.io/specs/css-extend-rule/#placeholder-selector).

```css
%button {
	display: inline-block;
	padding: 1em;
}

%big-button {
	@extend %button;
	font-size: 2em;
}

%red-big-button {
	@extend %big-button;
	color: red;
}

.button {
	@extend %button;
}

.big-button {
	@extend %big-button;
}

.red-big-button {
	@extend %red-big-button;
}

.red-big-button-rounded {
	@extend %red-big-button;
	border-radius: 8px;
}
```

And stylecow converts to:

```css
.red-big-button, .red-big-button-rounded, .big-button, .button {
	display: inline-block;
	padding: 1em;
}
.red-big-button, .red-big-button-rounded, .big-button {
	font-size: 2em;
}
.red-big-button, .red-big-button-rounded {
	color: red;
}
.red-big-button-rounded {
	border-radius: 8px;
}
```

More demos in [the tests folder](https://github.com/stylecow/stylecow-plugin-extend/tree/master/tests/cases)
