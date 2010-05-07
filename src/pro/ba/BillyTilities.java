package pro.ba;

import java.security.SecureRandom;  // cryptographically secure RNG.
//This uses http://www.softwaremonkey.org/Code/MathEval
//Another possibility: http://github.com/darius/expr


public class BillyTilities {

	// TODO: 
//  0. add code below to the git repository (delete it from here when done)
//  1. tactile feedback
//  2. counter (important for removing ambiguity about which roll was for real)
//  3. don't barf if probability not in [0,1] -- maybe just clip it to [0,1], ie, p = max(0,min(1,p))
//  4. show what probability evaluates to, even if not in [0,1]
//  5. 1-20 instead of 0-19
//  6. icon (maybe just could just be the 4 characters "Pr()" -- LaTeX standard way to write probability-of)
//  7. light up the cells brighter; make sure it's obvious when all happen to be lit up
//  8. my grid doesn't quite fit in landscape mode
//  9. no space in "BillyBee"

//*****************************************************************************



       static private SecureRandom rng = new SecureRandom();
       static private MathEval meval = new MathEval();
       
       static double arithmeval(String expr)
       {
               return meval.evaluate(expr);
       }
       
       // Bernoulli trial: return true with probability p.
       static boolean bern(double p)
       {
               return rng.nextDouble() < p;
       }
       
       // Return an n-element bitmask representing a random k-element subset of
       // {1,...,n}.  Note there will necessarily be k "true"s in the result.
       static boolean[] RandomKSubset(int n, int k)
       {
               int needed = k;
               boolean[] result = new boolean[n];
               for(int i = 0; i < n; i++) {
                       // ooh, more succinct version of the following if-else:
                       // if(result[i] = bern((double)needed/(n-i))) { needed--; }
                       // though that looks like an "i used = instead of ==" bug
                       if(bern((double)needed/(n-i))) {
                               result[i] = true;
                               needed--;
                       } else {
                               result[i] = false;
                       }
               }
               return result;
       }
       
       // Return an n-element bitmask representing a subset of {1,...,n} to light
       // up such that the probability of any pre-chosen number in {1,...,n} being
       // lit up is p. Eg, if p=1/2 then light up half of the {1,...,n} at random,
       // assuming n is even.
       static boolean[] BillySubset(int n, double p)
       {
               // probably fine to just cast to int instead of floor()
               int q = (bern(p*n - Math.floor(p*n)) ? 1 : 0);
               int nlit = (int)(p*n) + q;
               return RandomKSubset(n, nlit);
       }

}
