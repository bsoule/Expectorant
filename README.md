# Expectorant: the stochastic, nerdtastic, restaurant bill splitting app (and random number spinner)

## How do you use this?
*Enter a probability* (between 0 and 1) or an arithmetic expression that evaluates to a probability and press _Expectorize_.
A subset of the numbers 1-20 will light up such that any given number will be lit up with the given probability.

## Our favorite use cases 

Say you owe me $7 for lunch but only have a twenty.
If you give me the twenty with probability 7/20 then in expectation you've paid me $7!
So type in *7/20* and tell me to pick a number from 1 to 20.
Hit _Expectorize_ -- or have me do it so I know you didn't cheat -- and if my number is lit up then I lucked out and get the $20. 
(If you trust Expectorant to randomize properly (you can, we promise) then you can just always choose <b>1</b>, or any number.)

## Advanced feature
Entering something like <b>7@5,20</b> is a shortcut for <b>(7-5)/(20-5)</b>. 
That's the probability p such that (1-p)*5 + p*20 = 7. 
WTF? Here's TF: If you have a five and a twenty and owe me $7, then give me the twenty with that probability and the five otherwise. 
Exquisitely fair (in expectation)!

## Stochastic nerdtastic restaurant bill splitting
Say the subtotal is $100 and the items on the bill are $5, $25, $60, and $10. 
Enter <b>100:5</b> and have the person who ordered the $5 item pick a number from 1 to 20.
If their number is lit up (a 5% chance) they get to pay the whole bill! 
If not, amend the expression as <b>100:5,25</b> and repeat for the person who got the $25 item. 
They'll "win" with probability 25/(100-5). 
If they're off the hook, amend again to <b>100:5,25,60</b>. 
This time most likely -- p = 60/(100-5-25) -- the $60 person will win the honor of paying the bill. 
If not, notice that <b>100:5,25,60,10</b> yields 10/(100-5-25-60) = 1. 
So if the process makes it to the last item on the bill then whoever got that item is it.
Mathemagically, it doesn't matter what order you put the items in -- each person "wins" (pays the whole bill) with probability equal to their own fair share of the bill.
In other words, you pay in expectation exactly your fair share. 
Including tax and tip, even though we never entered those.
Pretty slick! 
Speaking of tips, you can minimize the hassle by starting with the most expensive items.
Then you don't have to figure out who most of the items belong to.
Oh, and if 3 people split the $10 pickled monkey balls just treat it as 3 items, $10/3 each (expressions instead of numbers are allowed).

## Hat tip
NB: The ingenious restaurant bill splitting algorithm was devised by Dave 
Pennock of, appropriately, oddhead.com.
