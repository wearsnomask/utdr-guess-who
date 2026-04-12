# UTDR Guess Who Unlimited

This is the repo for a Guess Who game for sets of Undertale and Deltarune characters, based on the original concept by Seek's Stuff: https://seeksstuff.itch.io/deltarune-guess-who.

To play the game, go here: https://wearsnomask.github.io/utdr-guess-who/

This rewrites the original game to function as a web app, for better cross-platform compatibility, sets it up to be easily moddable to add characters or whole new sets of characters, and adds a few other features.

This is a fan game of a fan game, and isn't officially associated with Toby Fox and team or Seek's Stuff. Undertale and Deltarune characters are used under the broad permission Toby Fox has granted for non-commercial fangames.

## Adding Character Sets

This game is designed to make it as easy as possible to extend it to add in new sets of characters to play with. Here's how to do it.

### Designing the set

Decide on a theme for the set and make a list of characters you want to include. If you really want to get wacky, they don't even have to be characters. Make a set out of anything you want! I recommend aiming for around 20-50 characters. Too few, and the game will be too short. Too many, and it will be too long (and you won't be able to see them all on screen at once on most monitors). But if you want more or fewer, go for it!

Once you've decided on the characters, get a `.png` image for each of them. Try not to make all the images simple face-on poses - more varied and dynamic poses will help make the game more interesting, by allowing questions like "Are you sitting down in your image?" If the background is transparent, it will default to black, so consider if this is best for the character. If they have design elements such as black or dark colors at the edge, you might want to choose another background color - consider checking where they appear in the game and use the dominant color of that background.

The game displays images at a size of 80px (width) by 128px (height), and will scale up or down by the best integer scale so that the provided image width will fit in this size. This means the ideal sizes are 80x128, 40x64, and 20x32. If the width is pretty far off from one of these values, trim, pad, and/or scale it to match. If the height is too small, don't worry - the image will be centered vertically. But if it's too high, it will overflow the frame, so you might need to add padding to either side.

Try to get original sprites if possible, for the best quality - pixel art can get blurry if you copy it via screen capture. It'll still be playable if you do, just not as crisp.

### Adding it to the game

To be able to add any character sets to the game, fork this project, and set it up to be served publicly via GitHub Pages, using the option to deploy via a workflow (using the existing "static.yml" workflow). If you aren't familiar with using GitHub Pages, a good tutorial on using it is provided by The Odin Project here: https://www.theodinproject.com/lessons/foundations-recipes#viewing-your-project-on-the-web. Or if all of this working with a repo is something you aren't familiar with, other tutorials on this site can help you with that too.

Then, edit the repo by adding in a folder with your character set in the "public/character-sets" folder. The name of the folder will be used exactly as it for the name of the character set. If you want (but you probably don't need to worry about this), you can add an index before the name of the character set in the folder to affect how it's sorted when the options are given to the player, e.g. folders named `1-Undertale` and `2-Deltarune` will put the Undertale character set first, whereas without the indices it would sort alphabetically with Deltarune first.

Inside this folder, add the images for all the characters in your set, with the name format `#-Name.png`, e.g. `1-Kris.png`, `2-Susie.png`, `3-Annoying Dog.png`, etc. The number for each indicates the order they'll be displayed in-game, and the name will be shown as their name. If you're fine with alphabetical order, you can also just leave out the number (e.g. `Kris.png`).

And... that's it! Commit the changes, push to the repository, and wait a minute for it to be deployed. Your version of the game will be deployed at an address that looks like "https://your-github-username.github.io/utdr-guess-who/", and you can share this with your friends so you can all play with the character set you added.

## Contact/Socials

**Charlotte Wears No Mask**

- https://x.com/LadyWearsNoMask
- https://bsky.app/profile/ladywearsnomask.bsky.social

## Credits

**Undertale and Deltarune game concepts:** Toby Fox and team, notably Temmie Change for character designs used here.

* [Undertale](https://undertale.com/)
* [Deltarune](https://deltarune.com/)

**Original UTDR Guess Who game concept and design:** [Seek's Stuff](https://www.youtube.com/@Seeks_stuff)

* [Seek's Cool Deltarune Guess Who Game](https://seeksstuff.itch.io/deltarune-guess-who)

**Font:** m6x11 by [Daniel Linssen](https://managore.itch.io/) (https://managore.itch.io/m6x11)