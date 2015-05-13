# stylecow plugin extend

Stylecow plugin to work with @extend using the [syntax proposed by Tab Atkins](http://tabatkins.github.io/specs/css-extend-rule/#placeholder-selector).

```css
%display-block {
	display: block;
}

%display-block > p {
	color: yellow;
}

div %display-block > p {
	color: orange
}

.is-block {
	@extend %display-block;
}

.is-red-block {
	@extend %display-block;
	color: red;
}
```

And stylecow converts to:

```css
.is-block, .is-red-block {
	display: block;
}
.is-block > p, .is-red-block > p {
	color: yellow;
}
div .is-block > p, div .is-red-block > p {
	color: orange;
}
.is-block {
	
}
.is-red-block {
	color: red;
}
```

More demos in [the tests folder](https://github.com/stylecow/stylecow-plugin-extend/tree/master/tests/cases)
